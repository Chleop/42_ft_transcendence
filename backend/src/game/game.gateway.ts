import { OnModuleInit } from '@nestjs/common';
import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { GameService } from './game.service';
import { GameRoom } from './room';
import { PaddleDto } from './dto';

import { Client, Match } from './aliases';

// PLACEHOLDERS ==============
const matchmaking_timeout: number = 10000;

/* Track timeouts */
type TimeoutId = {
	// The match tracked
	match: string,
	
	// The setTimeout ID
	id: NodeJS.Timer
};
// END PLACEHOLDERS ==========

/* TODO:
	 - add timeout everywhere
	 - handle spectators
*/

/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({cors: {origin: ['http://localhost:3000']}, namespace: '/game'})
export class GameGateway {
	@WebSocketServer()
	private readonly server: Server = new Server();
	private game_service: GameService = new GameService();
	//private timeout_checker: TimeoutId[] = [];

	/* == PRIVATE ================================================================================= */

	/* -- INITIALISATION ------------------------ */
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
		//console.info(this.timeout_checker);
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
		//console.info({ timeout_checker: this.timeout_checker });
		this.game_service.display();
	}

	@SubscribeMessage('ok')
	private matchAccepted(client: Socket): void {
		try {
			const room: GameRoom = this.game_service.playerAcknowledged(client);
			//if (room !== null)
				//this.ignoreTimeout(room.match);
		} catch (e) {
			console.info('Ok intercepted but not associated room:', e);
			client.disconnect(true);
		}
	}

	@SubscribeMessage('update')
	private updateEnemy(client: Socket, dto: PaddleDto): void {}

	/* -- UTILITARIES --------------------------- */
	private matchmake(match: Match): void {
		match.player1.socket.emit('matchFound', match.player2.id);
		match.player2.socket.emit('matchFound', match.player1.id);
		return ;
	}
//		const timeout: number = setTimeout(
//			this.checkTimeout,
//			matchmaking_timeout,
//			match
//		) as unknown as number;
//		this.timeout_checker.push({
//			match: match.name,
//			id: timeout 
//		});
//	}

	/*
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
 */

}
