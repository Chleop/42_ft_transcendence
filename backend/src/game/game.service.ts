import { Injectable } from '@nestjs/common';
import { Ball, Client } from './aliases';
import { GameRoom } from './room';

/* For now, gamerooms are named after a name given in the dto
	 Bound to be named after the host once we manage the jwt/auth token. */

/* Manage rooms + save in database */
@Injectable()
export class GameService {
	public game_rooms: GameRoom[] = [];

	/* == PUBLIC ================================================================================== */

	/* -- ROOM MANIPULATION --------------------- */
	public joinRoom(room_name: string, user: Client): string {
		console.info(`GameService JoinRoom`);
		if (this.findUserRoom(user.socket_id) !== undefined) {
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
		const room: GameRoom | undefined = this.findUserRoom(socket_id);
		if (room === undefined)
			throw 'Not in a room';
		const is_empty: boolean = room.removeUser(socket_id);
		if (is_empty) {
			console.info(`Room ${room.name} is empty`);
			this.removeRoom(room.name);
		}
		return {name: room.name, empty: is_empty};
	}

	public removeRoom(room: string): void {
		const index: number = this.game_rooms.findIndex((obj) => {
			return (room === obj.name);
		});
		if (index >= 0)
			this.game_rooms.splice(index, 1);
	}

	/* == PRIVATE ================================================================================= */

	/* -- UTILS --------------------------------- */
	private findUserRoom(socket_id: string): GameRoom | undefined {
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return obj.isClientInRoom(socket_id);
		});
		return room;
	}

	private createRoom(room_name: string, user: Client): undefined {
		console.info("Create room");
		const room: GameRoom = new GameRoom(room_name, user);
		this.game_rooms.push(room);
		return undefined;
	}

}
