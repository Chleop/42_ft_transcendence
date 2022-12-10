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
import { GameService } from './game.service';
import { BallDto } from './dto';
import { GameRoom } from './room';

// PLACEHOLDER
class UserInfoDto {
	readonly id: string;
}

type Spectator = {
	client: Socket,
	room: string
};

/* Will only listen to events comming from `http://localhost:3000/game` */
@WebSocketGateway({cors: {origin: ['http://localhost:3000']}, namespace: '/game'})
export class GameServer {
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
	/* Client joining a game */
	@SubscribeMessage('joinGame')
	private joinGame(client: Socket, data: {room: string, dto: UserInfoDto}): void {
		console.log("Game JoinGame: ", client.id);
		try {
			const room_name: string = this.game_service.joinRoom(data.room, {
				id: data.dto.id,
				socket_id: client.id
			});
			client.join(room_name);
			this.server.to(room_name).emit('joinedGame', `Welcome, ${data.dto.id} :)`);
			console.info(`${client.id} joined the room ${room_name}`);
			console.info(this.game_service.game_rooms);
		} catch (e) {
			console.info(e);
		}
	}

	/* Client leaving the game */
	@SubscribeMessage('leaveGame')
	private leaveGame(client: Socket, dto: UserInfoDto): void {
		console.log("Game LeaveGame: ", client.id);
		try {
			const room_infos: {
				name: string,
				empty: boolean
			} = this.game_service.leaveRoom(client.id);
			client.leave(room_infos.name);
			this.server.to(room_infos.name).emit('leftGame', `Sad to see ${dto.id} leave :o`);
			console.info(`${client.id} left the game and is removed from ${room_infos.name}`);
			if (room_infos.empty)
				this.checkRoom(room_infos.name);
			console.info(this.game_service.game_rooms);
		} catch (e) {
			console.info(e);
		}
	}

	private checkRoom(room_name: string): void {
		this.server.in(room_name).disconnectSockets();
		this.server.to(room_name).emit('leftGame', `The room is closing`);
	}

	private display(item: any): void {
		console.info(typeof item, item);
	}
}
