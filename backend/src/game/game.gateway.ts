import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { GameRoom } from "./rooms";
import { PaddleDto } from "./dto";
import { Results, ScoreUpdate, OpponentUpdate } from "./objects";
import { Ball } from "./gameplay";
import { Match } from "./aliases";
import { BadRequestException, ConflictException, Logger } from "@nestjs/common";
import { Constants } from "./constants";
import { BadEvent, WrongData } from "./exceptions";
import { ChatGateway } from "src/chat/chat.gateway";
import { e_user_status } from "src/user/enum";

@WebSocketGateway({
	namespace: "game",
	path: "/api/game_socket/socket.io",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private readonly chat_gateway: ChatGateway;
	private timeouts: Map<string, NodeJS.Timer>;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService, chat_gateway: ChatGateway) {
		this.server = new Server();
		this.game_service = game_service;
		this.chat_gateway = chat_gateway;
		this.timeouts = new Map<string, NodeJS.Timer>();
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
		this.logger.log(`[${client.data.user.login} connected]`);
		try {
			const queue_result: GameRoom | { is_invite: boolean } =
				this.game_service.queueUp(client);
			if (queue_result instanceof GameRoom) this.matchmake(queue_result);
			else if (queue_result.is_invite === true) {
				this.logger.debug("tried to invite someone");
				this.chat_gateway.forward_to_user_socket(
					"invite",
					client.handshake.auth.friend,
					client.data.user.id,
				);
			}
		} catch (e) {
			if (e instanceof BadEvent || e instanceof WrongData) {
				this.sendError(client, e);
				this.handleDisconnect(client);
				client.disconnect();
				return;
			}
			throw e;
		}
	}

	/**
	 * (from OnGatewayDisconnect)
	 * Handler for gateway disconnection.
	 *
	 * Removes client from queue if in it.
	 * Else saves and destroy the ongoing game they're in.
	 * Also removes timer if it hasn't fired yet.
	 */
	public async handleDisconnect(client: Socket): Promise<void> {
		const room: GameRoom | null = this.game_service.unQueue(client);
		if (room !== null) {
			const timer: NodeJS.Timer | undefined = this.timeouts.get(room.match.name);
			if (timer !== undefined) {
				clearTimeout(timer);
				this.timeouts.delete(room.match.name);
			}
			await this.endGameEarly(client, room);
			this.game_service.destroyRoom(room);
		}
		this.chat_gateway.broadcast_to_online_related_users({
			id: client.data.user.id,
			status: e_user_status.ONLINE,
		});
		this.logger.log(`[${client.data.user.login} disconnected]`);
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
			update.player.emit("updateOpponent", update.updated_paddle);
		} catch (e) {
			if (e instanceof BadEvent) {
				this.logger.error(e.message);
				this.sendError(client, e);
				this.handleDisconnect(client);
				client.disconnect();
				return;
			}
			throw e;
		}
	}

	/* PRIVATE ================================================================= */

	/**
	 * Updates the two matched players with each others infos.
	 *
	 * After 3s, the game will start.
	 */
	private matchmake(game_room: GameRoom): void {
		game_room.match.player1.emit("matchFound", game_room.match.player2.data.user);
		game_room.match.player2.emit("matchFound", game_room.match.player1.data.user);
		game_room.match.player1.data.user.status = e_user_status.INGAME;
		game_room.match.player2.data.user.status = e_user_status.INGAME;
		this.chat_gateway.broadcast_to_online_related_users({
			id: game_room.match.player1.data.user.id,
			status: e_user_status.INGAME,
		});
		this.chat_gateway.broadcast_to_online_related_users({
			id: game_room.match.player2.data.user.id,
			status: e_user_status.INGAME,
		});
		this.timeouts.set(game_room.match.name, setTimeout(this.startGame, 3000, this, game_room));
	}

	/**
	 * Sends initial ball state and initiate interval.
	 */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: Ball = room.startGame();

		room.match.player1.emit("gameStart", initial_game_state);
		room.match.player2.emit("gameStart", initial_game_state);
		room.setPlayerPingId(setInterval(me.sendGameUpdates, Constants.ping, me, room));

		me.timeouts.delete(room.match.name);
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

				const is_winner_left: boolean = update.winner === room.match.player1.data.user.id;
				me.updateSocketScore(room.match.player1, is_winner_left);
				me.updateSocketScore(room.match.player2, !is_winner_left);

				// const last_score: ScoreUpdate = room.getScoreUpdate();
				// room.match.player1.emit("updateScore", last_score);
				// room.match.player2.emit("updateScore", last_score.invert());
				const match: Match = await me.game_service.registerGameHistory(room, update);
				me.game_service.destroyRoom(room);
				return me.disconnectRoom(match);
			}
		} catch (e) {
			if (e instanceof BadRequestException || e instanceof ConflictException) {
				me.logger.error(e.message);
				me.sendError(room.match.player1, e);
				me.sendError(room.match.player2, e);
				me.disconnectRoom(room.match);
				return;
			}
			throw e;
		}
	}

	/**
	 * Kicks players from an ongoing game.
	 *
	 * The game is being saved before being destroyed.
	 */
	private async endGameEarly(client: Socket, room: GameRoom): Promise<void> {
		const results: Results = room.cutGameShort(room.playerNumber(client));
		room.destroyPlayerPing();
		if (room.is_ongoing) {
			room.is_ongoing = false;

			try {
				await this.game_service.registerGameHistory(room, results);
				const is_winner_left: boolean = results.winner === room.match.player1.data.user.id;
				this.updateSocketScore(room.match.player1, is_winner_left);
				this.updateSocketScore(room.match.player2, !is_winner_left);
			} catch (e) {
				if (e instanceof BadRequestException || e instanceof ConflictException) {
					this.logger.error(e.message);
					this.sendError(room.match.player1, e);
					this.sendError(room.match.player2, e);
				} else {
					throw e;
				}
			}
			this.disconnectRoom(room.match);
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

	/**
	 * Changes the game data of the socket, switches back status.
	 */
	private updateSocketScore(client: Socket, has_won: boolean): void {
		if (has_won === true) ++client.data.user.games_won_count;
		++client.data.user.games_played_count;
		client.data.user.status = e_user_status.ONLINE;
	}
}
