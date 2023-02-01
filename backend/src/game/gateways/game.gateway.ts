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
import { Results, Ball, ScoreUpdate } from "../objects";
import { Match, OpponentUpdate } from "../aliases";
import { BadRequestException, ConflictException } from "@nestjs/common";

import * as Constants from "../constants/constants";

/**
 * setTimeout tracker
 */
type TimeoutId = {
	match: string;
	timer: NodeJS.Timer;
};

/* EVENT LIST ===============================================================

From the client:
	- `connection`
		implicitly handled by 'handleConnection'.
		the jwt token must be checked and the client is registed in the matchmaking queue.
	 	if another client was in the queue, they are matched in 'matchmake'.

	- `disconnect`
		implicitly handled by 'handleDisconnect'.
		if the client was not in the queue, they are simply disconnected.
		if they were matched with another client (or in a game), they both are disconnected.

	- `update`
		handled by 'updateOpponent'.
		during the game, the client will regularly send their paddle position to the gateway.
		the gateway will check those values (TODO: anticheat), and, if the data seems accurate,
		it is sent to their opponent.

From the server:
	- `matchFound`
		once two clients are matched, they are sent this event.
		the gateway will then await for both matched client to send the `ok` event.

	- `gameStart`
		3 seconds after the two players get matched, they get sent this event which contains the
		initial ball position and velocity vector data object.

	- `updateOpponent`
		when the gateway receives an update from a client, it processes it then sends it to the
		client's opponent, labeled with this event.

	- `updateBall`
		contains ball update

	- `updateScore`
		updates only once one of the players scores

	- `error`
		sends error to client

============================================================================= */

@WebSocketGateway({
	namespace: "game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private timeouts: TimeoutId[];

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
		this.timeouts = [];
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from OnGatewayInit)
	 * called as gateway is init.
	 */
	public afterInit(): void {
		console.log("Game gateway initialized");
	}

	/* Connection handlers ----------------------------------------------------- */

	/**
	 * (from OnGatewayConnection)
	 * Handler for gateway connection.
	 *
	 * Moves client to the queue if not already in game.
	 */
	public handleConnection(client: Socket): void {
		console.log(`[${client.handshake.auth.token} connected]`);
		const match: Match | null = this.game_service.queueUp(client);
		if (match !== null) this.matchmake(match);
	}

	/**
	 * (from OnGatewayDisconnect)
	 * Handler for gateway disconnection.
	 *
	 * Removes client from queue if in it.
	 * Else removes match.
	 * Also removes timer if it hasn't fired yet.
	 */
	public handleDisconnect(client: Socket): void {
		const match: Match | null = this.game_service.unQueue(client);
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
		console.log(`[${client.handshake.auth.token} disconnected]`);
		// this.game_service.display();
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
			client.disconnect();
		}
	}

	/* PRIVATE ================================================================= */

	/**
	 * Updates the two matched players with each others infos.
	 *
	 * After 3s, the game will start.
	 */
	private matchmake(match: Match): void {
		match.player1.emit("matchFound", match.player2.data.user);
		match.player2.emit("matchFound", match.player1.data.user);

		const room: GameRoom = this.game_service.createRoom(match);

		this.timeouts.push({
			match: room.match.name,
			timer: setTimeout(this.startGame, 3000, this, room),
		});
		this.game_service.display();
	}

	/**
	 * Sends initial ball state and initiate interval.
	 */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: Ball = room.startGame();

		console.log(room);
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
				room.has_updated_score = false;
				room.is_ongoing = false;
				const results: ScoreUpdate = room.getFinalScore();
				room.match.player1.emit("updateScore", results);
				room.match.player2.emit("updateScore", results.invert());
				const match: Match = await me.game_service.registerGameHistory(room, update);
				return me.disconnectRoom(match);
			}
		} catch (e) {
			if (e instanceof BadRequestException || e instanceof ConflictException) {
				me.sendError(room.match.player1, e);
				me.sendError(room.match.player2, e);
				console.log(e);
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
		match.player1.disconnect(true);
		match.player2.disconnect(true);
	}
}
