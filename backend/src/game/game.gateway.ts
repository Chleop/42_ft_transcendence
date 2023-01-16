import { WebSocketGateway, WebSocketServer, SubscribeMessage } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";
import { GameRoom } from "./room";
import { PaddleDto } from "./dto";
import { ResultsObject, GameUpdate } from "./objects";
import { AntiCheat, OpponentUpdate, Client, Match } from "./aliases";

// import * as Constants from "./constants/constants";

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
	- `connected`
		sent to the client as an acknowledgement of their initial connection.

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


	TODO: Change updateGame to those events
	- `updateBall`
		contains ball update

	- `updateScore`
		updates only once one of the players scores

======================================================================== END OF LIST ============ */

/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({
	namespace: "/game",
	cors: {
		origin: ["http://localhost:3000"],
	},
})
export class GameGateway {
	@WebSocketServer()
	public readonly server: Server;
	private readonly game_service: GameService;

	constructor() {
		this.server = new Server();
		this.game_service = new GameService();
	}

	/* == PRIVATE =============================================================================== */

	/* -- CONNECTION ---------------------------------------------------------- */
	/* Handle connection to server */
	public handleConnection(client: Socket): void {
		console.log(`[${client.id} connected]`);
		client.emit("connected", "Welcome");
		try {
			//TODO: Check if they are not spectator: middleware->`/spectator`?
			//TODO: handle authkey
			const user: Client = this.game_service.getUser(client, "abc"); // authkey
			const match: Match | null = this.game_service.queueUp(user);
			if (match !== null) this.matchmake(match);
		} catch (e) {
			client.disconnect(true);
			console.log(e);
		}
		this.game_service.display();
	}

	/* Handle disconnection from server */
	public handleDisconnect(client: Socket): void {
		const match: Match | null = this.game_service.unQueue(client);
		if (match !== null) {
			this.disconnectRoom(match);
		}
		console.log(`[${client.id} disconnected]`);
		this.game_service.display();
	}

	/* -- EVENT HANDLERS ------------------------------------------------------ */

	/* Handle paddle updates for the game */
	@SubscribeMessage("update")
	public updateEnemy(client: Socket, dto: PaddleDto): void {
		try {
			// TODO: Check paddledto accuracy
			const anticheat: AntiCheat | null = this.game_service.updateOpponent(client, dto);
			if (anticheat === null) {
				client.emit("stop");
				return;
			}
			const opponent_update: OpponentUpdate = anticheat.p2;
			opponent_update.player.emit("updateOpponent", opponent_update.updated_paddle);
			if (anticheat.p1) {
				client.emit("antiCheat", anticheat.p1);
			}
		} catch (e) {
			e;
		}
	}

	/* TEMPORARY: to stop the interval thingy */
	@SubscribeMessage("stop")
	public stopGame(client: Socket): void {
		client.disconnect(true);
	}

	/* -- MATCHMAKING --------------------------------------------------------- */
	/* Waits for the 2 players to accept the match */
	private matchmake(match: Match): void {
		const p1_decoded: UserData = this.game_service.decode(match.player1.id);
		const p2_decoded: UserData = this.game_service.decode(match.player2.id);
		match.player1.socket.emit("matchFound", p2_decoded);
		match.player2.socket.emit("matchFound", p1_decoded);

		const room: GameRoom = this.game_service.createRoom(match);

		// TODO: save timeout and reset it when needed
		setTimeout(this.startGame, 3000, this, room);
	}

	/* -- UPDATING TOOLS ------------------------------------------------------ */
	/* The game will start */
	private startGame(me: GameGateway, room: GameRoom): void {
		const initial_game_state: GameUpdate = room.startGame();

		console.log(room);
		// Send the initial ball { pos, v0 }
		room.match.player1.socket.emit("gameStart", initial_game_state);
		room.match.player2.socket.emit("gameStart", initial_game_state);
		room.setPingId(setInterval(me.sendGameUpdates, 16, me, room));
	}

	/* This will send a GameUpdate every 16ms to both clients in a game */
	private /*async*/ sendGameUpdates(me: GameGateway, room: GameRoom): void {
		//Promise<void> {
		try {
			const update: GameUpdate = room.updateGame();
			room.match.player1.socket.emit("updateGame", update);
			room.match.player2.socket.emit("updateGame", update.invert());
		} catch (e) {
			if (e instanceof ResultsObject) {
				/* Save results and destroy game */
				const match: Match = me.game_service.saveScore(room, e); //await me.game_service.saveScore(room, e);
				return me.disconnectRoom(match);
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
		match.player1.socket.disconnect(true);
		match.player2.socket.disconnect(true);
	}
}
