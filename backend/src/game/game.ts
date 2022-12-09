import {
	ValidationPipe,
	UsePipes,
	OnModuleInit
} from '@nestjs/common';
import {
	ConnectedSocket,
	WebSocketGateway,
	WebSocketServer,
	SubscribeMessage,
	MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameDto } from './dto';
import { GameService } from './game.service';

import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

// PLACEHOLDER
class UserInfoDto {}

class GameRoomDto {
	readonly room: string;

	@Type(() => GameDto)
	@ValidateNested()
	readonly data!: GameDto;
}

/* Will only listen to events comming from `http://localhost:3000/game` */
@WebSocketGateway({ cors: { origin: ['http://localhost:3000'] }, namespace: '/game' })
export class Game {
	/* The backend server websocket */
	@WebSocketServer()
	private server: Server;

	constructor(private gameService: GameService) {}

	/* == PUBLIC ========================= */

	/* -- CLIENT SOCKET MANAGING ------------------------------------------------------------------ */
	/* Handle connection to server */
	public handleConnection(client: Socket) {
		console.info(`Client '${client.id}' connected`);
	}

	/* Handle disconnection from server */
	public handleDisconnect(client: Socket) {
		console.info(`Client '${client.id}' disconnected`);
	}

	/* -- EVENTS MANAGING ------------------------------------------------------------------------- */
	/* Refresh backen of Pong game in room `data.room` */
	@SubscribeMessage('refresh')
	public refreshGame(@MessageBody() dto: GameDto, @ConnectedSocket() client: Socket): void {
		//TODO
		const message: string = this.gameService.refreshGame(dto);
		console.log(`Sent ${message} to '${dto.room}'`);
		this.server.to(dto.room).emit('refreshed', message);
	}

	/* Client joining a game */
	@SubscribeMessage('joinGame')
	public joinGame(client: Socket, data: {room: string, dto: UserInfoDto}): void {
		// The server will transfer the client to room
		console.info(`${client.id} joined the game and is moved to ${data.room}`);
		client.join(data.room);
		// Now, the server will tell the client that it was moved to `data.room`
		client.emit('joinedGame', data.room);
		// TODO: Process UserInfoDto to know the place of the user in the game: player / spectator
	}

	/* Client leaving the game */
	@SubscribeMessage('leaveGame')
	public leaveGame(client: Socket, data: {room: string, dto: UserInfoDto}): void {
		// The server will remove the client from the room
		// TODO: Allow time span before definitely kicking the client (timeout)
		console.info(`${client.id} left the game and is removed from ${data.room}`);
		client.leave(data.room);
		// Tell the client that it was removed from the room
		client.emit('leftGame', data.room);
	}

	/* == PRIVATE ======================== */

	private display(item: any): void {
		console.info(item, typeof item);
	}
}
