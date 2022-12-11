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
class UserInfoDto {
	readonly id: string;
}

type Spectator = {
	client: Socket,
	room: string
};
// END PLACEHOLDERS ==========

/* Gateway to events comming from `http://localhost:3000/game` */
@WebSocketGateway({cors: {origin: ['http://localhost:3000']}, namespace: '/game'})
export class GameGateway {
	@WebSocketServer()
	private server: Server = new Server();

	/* In the future: add to constructor
		 private matchMaking: MatchMaking;
	 */
	constructor(private game_service: GameService) {}

	/* == PUBLIC ================================================================================== */

	/* -- INITIALISATION ------------------------ */
	/* Handle connection to server */
	private handleConnection(client: Socket) {
		console.info(`Client '${client.id}' connected`);
	}

	/* Handle disconnection from server */
	private handleDisconnect(client: Socket) {
		// Send event to all clients in their room to tell them to wait
		console.info(`Client '${client.id}' disconnected`);
	}

	/* == PRIVATE ================================================================================= */

	/* -- EVENT MANAGING ------------------------ */

	//TODO: Change dto
	/* Client joining a game */
	@SubscribeMessage('joinGame')
	private joinGame(client: Socket, data: {room: string, dto: UserInfoDto}): void {
		//console.log("Game JoinGame: ", client.id);
		try {
			const room_name: string = this.game_service.joinRoom(data.room, {
				id: data.dto.id,
				socket_id: client.id
			});
			client.join(room_name);

			//TODO: send socketid + jwt? Front will identify it as player 1 or player 2
			this.server.to(room_name).emit('joinedGame', `Welcome, ${data.dto.id} :)`);
			//console.info(`${client.id} joined the room ${room_name}`);
			//console.info(this.game_service.game_rooms);
		} catch (e) {
			console.info(e);
		}
	}

	// TODO: Change dto
	/* Client leaving the game */
	@SubscribeMessage('leaveGame')
	private leaveGame(client: Socket, dto: UserInfoDto): void {
		//console.log("Game LeaveGame: ", client.id);
		try {
			const room_infos: {
				name: string,
				empty: boolean
			} = this.game_service.leaveRoom(client.id);
			client.leave(room_infos.name);
			this.server.to(room_infos.name).emit('leftGame', `Sad to see ${dto.id} leave :o`);
			//console.info(`${client.id} left the game and is removed from ${room_infos.name}`);
			//if (room_infos.empty) // remove room when empty
			this.clearRoom(room_infos.name);
			//console.info(this.game_service.game_rooms);
		} catch (e) {
			console.info(e);
			client.disconnect(true);
		}
	}

	/* Received update from someone */
	@SubscribeMessage('update')
	private updateGame(client: Socket, dto: PaddleDto): void {
		try {
			//const room: string = /* await */ ;
			//const update: GameUpdate = this.game_service.update();
			//socket.to(room).emit('updated', update);
		} catch (e) {
			// check if it's a player
			// else disconnect
		}
	}

	/* -- UTILITARIES --------------------------- */
	private clearRoom(room_name: string): void {
		console.info(`[Clearing room '${room_name}']`);
		this.game_service.removeRoom(room_name);
		this.server.to(room_name).emit('leftGame', `The room is closing`);
		this.server.socketsLeave(room_name);
	}

	private display(item: any): void {
		console.info(typeof item, item);
	}
}
