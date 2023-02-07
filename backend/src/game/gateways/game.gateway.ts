import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "../services/game.service";
import { GameRoom } from "../rooms";
import { PaddleDto } from "../dto";
import { Results, ScoreUpdate, OpponentUpdate } from "../objects";
import { Ball } from "../gameplay";
import { Match } from "../aliases";
import { BadRequestException, ConflictException, Logger } from "@nestjs/common";
import { Constants } from "../constants";

/**
 * setTimeout tracker
 */
type TimeoutId = {
	match: string;
	timer: NodeJS.Timer;
};

@WebSocketGateway({
	namespace: "game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private timeouts: TimeoutId[];
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
		this.timeouts = [];
		this.logger = new Logger(GameGateway.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from OnGatewayInit)
	 * called as gateway is init.
	 */
	public afterInit(): void {
		this.logger.log("Game gateway initialized");
	}

	/* Connection handlers ----------------------------------------------------- */

	/**
	 * (from OnGatewayConnection)
	 * Handler for gateway connection.
	 *
	 * Moves client to the queue if not already in game.
	 */
	public handleConnection(client: Socket): void {
		this.logger.verbose(`[${client.data.user.login} connected]`);
		try {
			const game_room: GameRoom | null = this.game_service.queueUp(client);
			if (game_room !== null) this.matchmake(game_room);
		} catch (e) {
			this.sendError(client, e);
			this.logger.error(e);
			client.disconnect();
		}
	}

	/**
	 * (from OnGatewayDisconnect)
	 * Handler for gateway disconnection.
	 *
	 * Removes client from queue if in it.
	 * Else removes match.
	 * Also removes timer if it hasn't fired yet.
	 */
	public async handleDisconnect(client: Socket): Promise<void> {
		const match: Match | null = await this.game_service.unQueue(client);
		if (match !== null) {
			const index: number = this.timeouts.findIndex((obj) => {
				return obj.match === match.name;
			});
			if (index >= 0) {
				clearTimeout(this.timeouts[index].timer);
				this.timeouts.splice(index, 1);
			}
			this.disconnectRoom(match);
		}
		this.logger.verbose(`[${client.data.user.login} disconnected]`);
	}

	/* Event handlers ---------------------------------------------------------- */

	/**
	 * On 'update' event.
	 *
	 * Client sent a paddle update.
	 * Refreshes room paddle position and send it to opponent.
	 */
	@SubscribeMessage("update")
	public updateEnemy(client: Socket, dto: PaddleDto): void {
		try {
			client.data.paddle_dto = dto;
			const update: OpponentUpdate = this.game_service.updateOpponent(client);
			update.player.emit("updateOpponent", client.data.paddle_dto);
		} catch (e) {
			this.sendError(client, e);
			this.logger.error(e);
			client.disconnect();
		}
	}

	/* PRIVATE ================================================================= */

	/**
	 * Updates the two matched players with each others infos.
	 *
	 * After 3s, the game will start.
	 */
	private matchmake(game_room: GameRoom): void {
		this.logger.verbose("New match was made");
		game_room.match.player1.emit("matchFound", game_room.match.player2.data.user);
		game_room.match.player2.emit("matchFound", game_room.match.player1.data.user);

		this.timeouts.push({
			match: game_room.match.name,
			timer: setTimeout(this.startGame, 3000, this, game_room),
		});
	}

	/**
	 * Sends initial ball state and initiate interval.
	 */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: Ball = room.startGame();

		room.match.player1.emit("gameStart", initial_game_state);
		room.match.player2.emit("gameStart", initial_game_state);
		room.setPlayerPingId(setInterval(me.sendGameUpdates, Constants.ping, me, room));

		const index: number = me.timeouts.findIndex((obj) => {
			return obj.match === room.match.name;
		});
		if (index < 0) return;
		me.timeouts.splice(index, 1);
	}

	/**
	 * Updates game at regular interval.
	 *
	 * Sends different updates, depending of the state of the game.
	 */
	private async sendGameUpdates(me: GameGateway, room: GameRoom): Promise<void> {
		try {
			const update: Ball | ScoreUpdate | Results = room.updateGame();
			if (update instanceof Ball) {
				/* Simple ball update */
				room.match.player1.emit("updateBall", update);
				room.match.player2.emit("updateBall", update.invert());
			} else if (update instanceof ScoreUpdate) {
				/* Someone marked a point */
				room.has_updated_score = false;
				room.match.player1.emit("updateScore", update);
				room.match.player2.emit("updateScore", update.invert());
			} else if (update instanceof Results) {
				/* The game ended */
				room.destroyPlayerPing();
				room.has_updated_score = false;
				room.is_ongoing = false;
				const last_score: ScoreUpdate = room.getFinalScore();
				room.match.player1.emit("updateScore", last_score);
				room.match.player2.emit("updateScore", last_score.invert());
				const match: Match = await me.game_service.registerGameHistory(room, update);
				return me.disconnectRoom(match);
			}
		} catch (e) {
			this.logger.error(e);
			if (e instanceof BadRequestException || e instanceof ConflictException) {
				me.sendError(room.match.player1, e);
				me.sendError(room.match.player2, e);
				me.disconnectRoom(room.match);
				return;
			}
			throw e;
		}
	}

	/**
	 * Sending error event to client.
	 */
	private sendError(client: Socket, err: string | Error): void {
		if (err instanceof Error) client.emit("error", err);
		else client.emit("error", new Error(err));
	}

	/**
	 * Disconnect players matched.
	 */
	private disconnectRoom(match: Match): void {
		match.player1.disconnect();
		match.player2.disconnect();
	}
}
