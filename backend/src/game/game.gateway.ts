import { OnModuleInit } from '@nestjs/common';
import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { GameService } from './game.service';
import { GameRoom } from './room';
import { PaddleDto } from './dto';
import { ResultsObject } from './results';
import {
	OpponentUpdate,
	Client,
	Match,
	Ball,
	GameUpdate
} from './aliases';

// PLACEHOLDERS ==============
const matchmaking_timeout: number = 10000;

/* Track timeouts */
type TimeoutId = {
	match: string,
	id: NodeJS.Timer
};


/* TODO:
	 - add timeout everywhere
	 - handle spectators
	 - separate matchmaking with gaminggggg
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

	- `ok`
 			handled by 'matchAccepted'.
		 	once the client is matched with another, they'll each have to accept by sending an 'ok' event.

	- `update`
 			handled by 'updateOpponent'.
		 	during the game, the client will regularly send their paddle position to the gateway.
		 	the gateway will check those values (TODO: anticheat), and, if the data seems accurate,
		 	it is sent to their opponent.

From the server:
	- `connected`
 			sent to the client as an acknowledgement of their initial connection.

	- `matchFound`
 			once two clients are matched, they are sent this event.
		 	the gateway will then await for both matched client to send the `ok` event.

	- `timedOut` (TODO: check validity)
 			if the two clients that were awaited didn't both accept, they get timed out and removed from
			the queue.

	- `unQueue`
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

======================================================================== END OF LIST ============ */


/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({
	namespace: '/game',
	cors: {
		origin: ['http://localhost:3000']
	}
})
export class GameGateway {
	@WebSocketServer()
	private readonly server: Server = new Server();
	private readonly game_service: GameService = new GameService();

	/* TODO: CHECK !! */
	private timeout_checker: TimeoutId[] = [];

	/* == PRIVATE ================================================================================= */

	/* -- CONNECTION ---------------------------------------------------------- */
	/* Handle connection to server */
	private handleConnection(client: Socket): void {
		console.info(`[${client.id} connected]`);
		client.emit('connected', 'Welcome');
		try {
			//TODO: Check if they are not spectator
			const user: Client = this.game_service.getUser(client, 'abc'); // authkey
			const match: Match = this.game_service.queueUp(user);
			if (match !== null)
				this.matchmake(match);
		} catch (e) {
			client.disconnect(true);
			console.info(e);
		}
		this.game_service.display();
	}

	/* Handle disconnection from server */
	private handleDisconnect(client: Socket): void {
		const match: Match = this.game_service.unQueue(client);
		if (match !== null) {
			match.player1.socket.emit('unQueued');
			match.player1.socket.disconnect(true);
			match.player2.socket.emit('unQueued');
			match.player2.socket.disconnect(true);
		}
		console.info(`[${client.id} disconnected]`);
		this.game_service.display();
	}

	/* -- EVENT HANDLERS ------------------------------------------------------ */
	/* Handle room creation (matchmaking accepted from both parties) */
	@SubscribeMessage('ok')
	private matchAccepted(client: Socket): void {
		try {
			const room: GameRoom = this.game_service.playerAcknowledged(client);
			if (room !== null) {
				//this.ignoreTimeout(room.match);
				room.match.player1.socket.emit('gameReady', room.match.player2.id);
				room.match.player2.socket.emit('gameReady', room.match.player1.id);
				setTimeout(this.startGame, 3000, room);
			}
		} catch (e) {
			console.info(e);
			client.disconnect(true);
		}
	}

	@SubscribeMessage('update')
	private updateEnemy(client: Socket, dto: PaddleDto): void {
		try {
			const opponent_update: OpponentUpdate = this.game_service.updateOpponent(client, dto);
			opponent_update.player.emit('updatedOpponent', opponent_update.updated_paddle);
		} catch (e) {
			console.info(e);
		}
	}

	/* -- MATCHMAKING --------------------------------------------------------- */
	/* Waits for the 2 players to accept the match */
	private matchmake(match: Match): void {
		match.player1.socket.emit('matchFound');
		match.player2.socket.emit('matchFound');
		// return;
		/* TODO: NEEDS TESTING !! */
		this.timeout_checker.push({
			match: match.name,
			id: setTimeout(this.checkTimeout, matchmaking_timeout, match)
		});
	}

	private checkTimeout(match: Match): void {
		const index_timeout: number = this.timeout_checker.findIndex((obj) => {
			return obj.match === match.name;
		});
		if (index_timeout < 0)
			return;
		this.game_service.ignore(match);
		match.player1.socket.emit('timedOut');
		match.player1.socket.disconnect(true);
		match.player2.socket.emit('timedOut');
		match.player2.socket.disconnect(true);
		this.timeout_checker.splice(index_timeout, 1);
	}

	private ignoreTimeout(match: Match): void {
		const index_timeout: number = this.timeout_checker.findIndex((obj) => {
			return obj.match === match.name;
		});
		if (index_timeout < 0)
			return ;
		clearTimeout(this.timeout_checker[index_timeout].id);
		this.game_service.ignore(match);
		this.timeout_checker.splice(index_timeout, 1);
	}

	/* -- UPDATING TOOLS ------------------------------------------------------ */
	/* The game will start */
	private startGame(room: GameRoom): void {
		const initial_game_state: GameUpdate = room.startGame();
		// Send the initial ball { pos, v0 }
		room.match.player1.socket.emit('gameStart', initial_game_state);
		room.match.player2.socket.emit('gameStart', initial_game_state);
		room.setPingId(setInterval(this.sendGameUpdates, 20));
	}

	/* This will send a GameUpdate every 20ms to both clients in a game */
	private sendGameUpdates(room: GameRoom): void {
		try {
			const update: GameUpdate = room.updateGame();
			console.log(update);
			room.match.player1.socket.emit('updateGame', update);
			room.match.player2.socket.emit('updateGame', update);
		} catch (e) {
			if (e instanceof ResultsObject) {
				/* Save results and destroy game */
				return this.game_service.saveScore(room, e);
			}
			// Error occured, make sure to destroy interval
			this.game_service.destroyRoom(room);
			throw e;
		}
	}

}
