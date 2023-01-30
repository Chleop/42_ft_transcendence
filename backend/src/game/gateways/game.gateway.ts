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
import { BadRequestException, ConflictException } from "@nestjs/common";

/* Track timeouts */
// type TimeoutId = {
// 	match: string;
// 	id: NodeJS.Timer;
// };

// PLACEHOLDERS ==============
type UserData = {
	id: string;
	// Avatar, etc
};

/* TODO:
	 - handle spectators
*/

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
	// - `connected`
	// 	sent to the client as an acknowledgement of their initial connection.

	- `matchFound`
		once two clients are matched, they are sent this event.
		the gateway will then await for both matched client to send the `ok` event.

	- `timedOut` // deprecated: useless if disconnect
		if the two clients that were awaited didn't both accept, they get timed out and removed from
		the queue.

	- `unQueue` // deprecated: useless if disconnect
		if the client was in the queue or in a game and suddenly disconnects, their opponent is
		notified via the `unQueue` event and both are properly disconnected.

	- `gameReady`
		when the two clients matched have accepted the game, they are alerted with this event.
		each gets sent their opponent id for the front-end (eg. to display each other's profile).

	- `gameStart`
		3 seconds after the two players get matched, they get sent this event which contains the
		initial ball position and velocity vector data object.

	- `updateOpponent`
		when the gateway receives an update from a client, it processes it then sends it to the
		client's opponent, labeled with this event.

	- `updateGame`
		every 20 milliseconds, the two matched client receive the pong ball updated data along with
		the current score.

	- `updateBall`
		contains ball update

	- `updateScore`
		updates only once one of the players scores

======================================================================== END OF LIST ============ */

/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({
	namespace: "game",
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;

	/* CONSTRUCTOR ============================================================= */

	constructor(game_service: GameService) {
		this.server = new Server();
		this.game_service = game_service;
	}

	/* PUBLIC ================================================================== */

	public afterInit(): void {
		console.log("Game gateway initialized");
	}

	/* Connection handlers ----------------------------------------------------- */

	/**
	 * Handler for gateway connection
	 */
	public handleConnection(client: Socket): void {
		console.log(`[${client.id} connected]`);
		// client.emit("connected", "Welcome");
		try {
			//TODO: Check if they are not spectator: middleware->`/spectator`?
			//TODO: handle authkey
			const user: Socket = this.game_service.getUser(client); // authkey
			const match: Match | null = this.game_service.queueUp(user);
			if (match !== null) this.matchmake(match);
		} catch (e) {
			client.disconnect(true);
			console.log(e);
		}
	}

	/**
	 * Handler for gateway disconnection
	 */
	public handleDisconnect(client: Socket): void {
		const match: Match | null = this.game_service.unQueue(client);
		if (match !== null) {
			this.disconnectRoom(match);
		}
		console.log(`[${client.id} disconnected]`);
		this.game_service.display();
	}

	/* Event handlers ---------------------------------------------------------- */

	/* Handle paddle updates for the game */
	// @UseGuards(JwtGuard)
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

	/* -- MATCHMAKING --------------------------------------------------------- */
	/* Waits for the 2 players to accept the match */
	private matchmake(match: Match): void {
		const p1_decoded: UserData = this.game_service.decode(match.player1.id);
		const p2_decoded: UserData = this.game_service.decode(match.player2.id);
		match.player1.emit("matchFound", p2_decoded);
		match.player2.emit("matchFound", p1_decoded);

		const room: GameRoom = this.game_service.createRoom(match);

		// TODO: save timeout and reset it when needed
		setTimeout(this.startGame, 3000, this, room);
		this.game_service.display();
	}

	/* -- UPDATING TOOLS ------------------------------------------------------ */
	/* The game will start */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: Ball = room.startGame();

		console.log(room);
		// Send the initial ball { pos, v0 }
		room.match.player1.emit("gameStart", initial_game_state);
		room.match.player2.emit("gameStart", initial_game_state);
		room.setPlayerPingId(setInterval(me.sendGameUpdates, Constants.ping, me, room));
	}

	/* This will send a GameUpdate every 16ms to both clients in a game */
	private async sendGameUpdates(
		me: GameGateway,
		room: GameRoom,
	): //void {
	Promise<void> {
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
						console.log(e);
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

	/* -- UTILS --------------------------------------------------------------- */
	//TODO: make it cleaner
	private disconnectRoom(match: Match): void {
		match.player1.disconnect(true);
		match.player2.disconnect(true);
	}
}
