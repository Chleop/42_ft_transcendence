import {
	Injectable
} from '@nestjs/common';
import { BallDto } from './dto';
import { Player, GameRoom } from './room';

@Injectable()
export class GameService {
	public game_rooms: GameRoom[] = [];

	/* == PUBLIC ================================================================================== */

	/* -- ROOM MANIPULATION --------------------- */
	public joinRoom(room_name: string, user: Player): string {
		console.info(`GameService JoinRoom`);
		if (this.findUser(user.socket_id) !== undefined) {
			throw 'User already in a room';
		}
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return (obj.name === room_name);
		});
		if (room === undefined) {
			this.createRoom(room_name, user);
		} else {
			room.addGuest(user);
		}
		return room_name;
	}

	public leaveRoom(socket_id: string): {name: string, empty: boolean} {
		console.info(`GameService LeaveRoom`);
		const room: GameRoom | undefined = this.findUser(socket_id);
		if (room === undefined)
			throw 'Not in a room';
		const is_empty: boolean = room.removeUser(socket_id);
		if (is_empty) {
			console.info(`Room ${room.name} is empty`);
			this.removeRoom(room);
		}
		return {name: room.name, empty: is_empty};
	}

	private removeRoom(room: GameRoom): void {
		const index: number = this.game_rooms.findIndex((obj) => {
			return (room === obj);
		});
		if (index >= 0)
			this.game_rooms.splice(index, 1);
	}

	/* == PRIVATE ================================================================================= */

	/* -- UTILS --------------------------------- */
	private findUser(user_id: string): GameRoom | undefined {
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return (obj.user1 !== undefined && obj.user1.socket_id === user_id)
			|| (obj.user2 !== undefined && obj.user2.socket_id === user_id);
		});
		return room;
	}

	private createRoom(room_name: string, user: Player): undefined {
		console.info("Create room");
		const room: GameRoom = new GameRoom(room_name, user);
		this.game_rooms.push(room);
		return undefined;
	}

}
