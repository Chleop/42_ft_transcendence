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
import { AntiCheat, OpponentUpdate, Match } from "../aliases";

import * as Constants from "../constants/constants";
import { BadRequestException, ConflictException, Logger } from "@nestjs/common";

/* Track timeouts */
// type TimeoutId = {
// 	match: string;
// 	id: NodeJS.Timer;
// };

/* === EVENT LIST ==================================================================================

From the client:
	- `connection`
		implicitly handled by 'handleConnection'.
		the jwt token must be checked and the client is registed in the matchmaking queue.
	 	if another client was in the queue, they are matched in 'matchmake'.

	- `disconnect`
		implicitly handled by 'handleDisconnect'.
		if the client was not in the queue, they are simply disconnected.
		if they were matched with another client (or in a game), they both are disconnected.

	- `ok`	// deprecated
		handled by 'matchAccepted'.
		once the client is matched with another, they'll each have to accept by sending
		an 'ok' event.

	- `update`
		handled by 'updateOpponent'.
		during the game, the client will regularly send their paddle position to the gateway.
		the gateway will check those values (TODO: anticheat), and, if the data seems accurate,
		it is sent to their opponent.

	- `stop`
		will simply disconnect the client.
		temporary, this is meant to test the setInterval stuff

From the server:
	- `matchFound`
		once two clients are matched, they are sent this event.
		the gateway will then await for both matched client to send the `ok` event.

	- `gameReady`
		when the two clients matched have accepted the game, they are alerted with this event.
		each gets sent their opponent id for the front-end (eg. to display each other's profile).

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

======================================================================== END OF LIST ============ */

@WebSocketGateway({
	namespace: "game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;
	private readonly _logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
		this._logger = new Logger(GameGateway.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * (from OnGatewayInit)
	 * called as gateway is init
	 */
	public afterInit(): void {
		this._logger.log("Game gateway initialized");
	}

	/* Connection handlers ----------------------------------------------------- */

	/**
	 * (from OnGatewayConnection)
	 * Handler for gateway connection
	 *
	 * Moves client to the queue if not already in game
	 */
	public handleConnection(client: Socket): void {
		this._logger.log(`[${client.handshake.auth.token} connected]`);
		const match: Match | null = this.game_service.queueUp(client);
		if (match !== null) this.matchmake(match);
	}

	/**
	 * (from OnGatewayDisconnect)
	 * Handler for gateway disconnection
	 *
	 * Removes client from queue if in it
	 * Else removes match
	 */
	public handleDisconnect(client: Socket): void {
		const match: Match | null = this.game_service.unQueue(client);
		if (match !== null) this.disconnectRoom(match);
		this._logger.log(`[${client.handshake.auth.token} disconnected]`);
		// this.game_service.display();
	}

	/* Event handlers ---------------------------------------------------------- */

	/**
	 * On 'update' event
	 *
	 * Client sent a paddle update
	 * Refreshes room paddle position and send it to opponent
	 */
	@SubscribeMessage("update")
	public updateEnemy(client: Socket, dto: PaddleDto): void {
		try {
			// TODO: Check paddledto accuracy
			const anticheat: AntiCheat = this.game_service.updateOpponent(client, dto);
			const opponent_update: OpponentUpdate = anticheat.p2;
			opponent_update.player.emit("updateOpponent", opponent_update.updated_paddle);
			if (anticheat.p1) {
				client.emit("antiCheat", anticheat.p1);
			}
		} catch (e) {
			client.emit("stop");
			e;
		}
	}

	/* TEMPORARY: to stop the interval thingy */
	@SubscribeMessage("stop")
	public stopGame(client: Socket): void {
		client.disconnect(true);
	}

	/* PRIVATE ================================================================= */

	/**
	 * Updates the two matched players with each others infos
	 * After 3s, the game will start
	 */
	private matchmake(match: Match): void {
		// const p1_decoded: UserData = this.game_service.decode(match.player1.handshake.auth.token);
		// const p2_decoded: UserData = this.game_service.decode(match.player2.handshake.auth.token);
		match.player1.emit("matchFound", match.player2.handshake.auth.token);
		match.player2.emit("matchFound", match.player1.handshake.auth.token);

		const room: GameRoom = this.game_service.createRoom(match);

		// TODO: save timeout and reset it when needed
		setTimeout(this.startGame, 3000, this, room);
		this.game_service.display();
	}

	/**
	 * Sends initial ball state and starts game state on regular interval
	 */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: Ball = room.startGame();

		this._logger.debug(room);
		room.match.player1.emit("gameStart", initial_game_state);
		room.match.player2.emit("gameStart", initial_game_state);
		room.setPlayerPingId(setInterval(me.sendGameUpdates, Constants.ping, me, room));
	}

	/* This will send a GameUpdate every 16ms to both clients in a game */
	private async sendGameUpdates(me: GameGateway, room: GameRoom): Promise<void> {
		try {
			const update: Ball | ScoreUpdate = room.updateGame();
			if (update instanceof Ball) {
				room.match.player1.emit("updateBall", update);
				room.match.player2.emit("updateBall", update.invert());
			} else if (update instanceof ScoreUpdate) {
				room.match.player1.emit("updateScore", update);
				room.match.player2.emit("updateScore", update.invert());
			}
		} catch (e) {
			if (e instanceof Results) {
				/* Save results and destroy game */
				const update: ScoreUpdate = room.getFinalScore();
				room.match.player1.emit("updateScore", update);
				room.match.player2.emit("updateScore", update.invert());
				try {
					const match: Match = await me.game_service.registerGameHistory(room, e);
					return me.disconnectRoom(match);
				} catch (e) {
					if (e instanceof BadRequestException || e instanceof ConflictException) {
						this._logger.error(e);
						me.disconnectRoom(room.match);
					} else {
						me.disconnectRoom(room.match);
						throw e;
					}
				}
			} else {
				// TODO: handle properly, with error sending
				// Other error occured, make sure to destroy interval
				me.disconnectRoom(room.match);
				throw e;
			}
		}
	}

	/**
	 * Disconnect players matched
	 */
	private disconnectRoom(match: Match): void {
		match.player1.disconnect(true);
		match.player2.disconnect(true);
	}
}
