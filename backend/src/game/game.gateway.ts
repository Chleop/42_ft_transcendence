import { OnModuleInit } from '@nestjs/common';
import {
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { GameService } from './game.service';
import { GameRoom } from './room';
import { Ball } from './aliases';
import { PaddleDto } from './dto';

// PLACEHOLDERS ==============
import { Player, Match } from './alias';
// END PLACEHOLDERS ==========

const matchmaking_timeout: number = 10000;

type TimeoutId = {
	match: string,
	id: number
};


/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({cors: {origin: ['http://localhost:3000']}, namespace: '/game'})
export class GameGateway {
	@WebSocketServer()
	private readonly server: Server = new Server();
	private game_service: GameService = new GameService();
	private timeout_checker: TimeoutId[] = [];

	/* == PRIVATE ================================================================================= */

	/* -- INITIALISATION ------------------------ */
	/* Handle connection to server */
	private handleConnection(client: Socket) {
		client.emit('connected', 'Welcome');
		try {
			//TODO: Check if they are not spectator
			const user: Player = this.game_service.getUser(client, 'abc'); // authkey
			const match: Match = this.game_service.queueUp(user);
			if (match !== null)
				this.matchmake(match);
		} catch (e) {
			client.disconnect(true);
			console.info(e);
		}
	}

	/* Handle disconnection from server */
	private handleDisconnect(client: Socket) {
		console.info(`[${client.id} disconnected]`);
	}

	@SubscribeMessage('ok')
	private matchAccepted(client: Socket) {
		try {
			const room: GameRoom = this.game_service.playerAcknowledged(client);
			if (room !== null)
				this.ignoreTimeout(room.match);
		} catch (e) {
			console.info('Ok intercepted but not associated room:', e);
			client.disconnect(true);
		}
	}

	/* -- UTILITARIES --------------------------- */
	private matchmake(match: Match): void {
		match.player1.socket.emit('matchFound', match.player2.id);
		match.player2.socket.emit('matchFound', match.player1.id);
		this.timeout_checker.push({
			match: match.name,
			id: setTimeout(this.checkTimeout, matchmaking_timeout, match) as unknown as number
		});
	}

	private checkTimeout(match: Match): void {
		const index_timeout: number = this.timeout_checker.findIndex((obj) => {
			return obj.match === match.name;
		});
		if (index_timeout < 0)
			return;
		this.game_service.ignore(match);
		match.player1.socket.disconnect();
		match.player2.socket.disconnect();
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


//	/* == PUBLIC ================================================================================== */

//	/* -- EVENT MANAGING ------------------------ */
//	//TODO: Change dto
//	/* Client joining a game */
//	@SubscribeMessage('joinGame')
//	private joinGame(client: Socket): void {
//
//		try {
//			const room: GameRoom = this.game_service.joinRoom(client.id);
//			client.join(room.name);
//
//			//TODO: send `room` instance (will contain ids)
//			this.server.to(room.name).emit('joinedGame', `Welcome, ${client.id} :)`);
//			if (room.isFull())
//				this.initialize(room);
//		} catch (e) {
//			console.info(e);
//		}
//	}
//
//	// TODO: Change dto
//	/* Client leaving the game */
//	@SubscribeMessage('leaveGame')
//	private leaveGame(client: Socket): void {
//		try {
//			const room: GameRoom = this.game_service.leaveRoom(client.id);
//			client.leave(room.name);
//			this.server.to(room.name).emit('leftGame', `Sad to see ${client.id} leave :o`);
//			this.clearRoom(room.name);
//		} catch (e) {
//			console.info(e);
//			client.disconnect(true);
//		}
//	}
//
//	/* Received update from someone */
//	@SubscribeMessage('update')
//	private updateGame(client: Socket, dto: PaddleDto): void {
//		try {
//			//const room: string = /* await */ ;
//			//const update: GameUpdate = this.game_service.update();
//			//socket.to(room).emit('updated', update);
//		} catch (e) {
//			// check if it's a player
//			// else disconnect
//		}
//	}
//
//	private initialize(room: GameRoom): void {
//		// Send room infos first,
//		this.server.to(room.name).emit('inializing', room);
//	}
//
//	private clearRoom(room_name: string): void {
//		console.info(`[Clearing room '${room_name}']`);
//		this.server.to(room_name).emit('leftGame', `The room is closing`);
//		this.server.socketsLeave(room_name);
//		this.game_service.removeRoom(room_name);
//	}
//
//	private display(item: any): void {
//		console.info(typeof item, item);
//	}
}
