import { Injectable } from '@nestjs/common';
import { GameRoom } from './room';

import { Score } from './aliases';
import { Player, Match } from './alias';
import { Socket } from 'socket.io';

/* For now, gamerooms are named after a name given in the dto
	 Bound to be named after the host once we manage the jwt/auth token. */

type Handshake = {
	match: Match,
	one: boolean,
};

/* Manage rooms, save scores in database */
@Injectable()
export class GameService {
	private game_rooms: GameRoom[] = [];
	private handshakes: Handshake[] = [];
	private queue: Player = null;

	/* == PUBLIC ================================================================================== */

	public queueUp(user: Player): Match | null {
		if (this.queue === null) {
			this.queue = user;
			return null;
		}
		const match: Match = {
			name: this.queue.socket.id + user.socket.id,
			player1: this.queue,
			player2: user
		};
		this.queue = null;
		this.handshakes.push({
			match: match,
			one: false,
		});
		return match;
	}

	public unQueue(client: Socket): Match | null {
		if (this.queue && this.queue.socket.id === client.id) {
			this.queue = null;
		} else {
			// The match wasn't accepted yet
			const handshake: Handshake = this.findUserMatch(client);
			if (handshake !== undefined) {
				this.ignore(handshake.match);
				return handshake.match;
			}
			// The game was ongoing
			const game_room_index: number = this.findUserRoomIndex(client);
			if (!(game_room_index < 0)) {
				console.info('Kicked');
				const match: Match = this.game_rooms[game_room_index].match;
				this.saveScore(game_room_index);
				return match;
			}
		}
		return null;
	}

	public getUser(sock: Socket, authkey: string): Player {
		if (authkey !== 'abc')
			throw 'Wrong key';
		return {
			socket: sock,
			id: 'xyz'
		};
	}

	public playerAcknowledged(client: Socket): GameRoom | null {
		const handshake: Handshake = this.findUserMatch(client);
		if (handshake === undefined) // Tried to send ok before room creation
			throw 'Not awaiting, nice try';
		console.info(`${client.id} accepted`);
		if (!handshake.one)
			handshake.one = true;
		else
			return this.createRoom(handshake.match);
		return null;
	}

	public ignore(match: Match): void {
		const index: number = this.handshakes.findIndex((obj) => {
			return (obj.match === match);
		});
		if (index < 0)
			throw 'Can\' find match';
		this.handshakes.splice(index, 1);
	}

	public display(): void {
		console.info({
			handshakes: this.handshakes,
			rooms: this.game_rooms
		});
	}

	/* == PRIVATE ================================================================================= */

	private createRoom(match: Match): GameRoom {
		const room: GameRoom = new GameRoom(match);
		this.game_rooms.push(room);
		this.ignore(match);
		return room;
	}

	private destroyRoom(index: number): void {
		this.game_rooms.splice(index, 1);
	}

	private saveScore(index: number): void {
		try {
			const score: Score = this.game_rooms[index].getScores();
			// Add to DB
			console.info("Scores:", score);
		} catch (e) {
			console.info(e);
		}
		this.destroyRoom(index);
	}

	private findUserMatch(client: Socket): Handshake | undefined {
		const handshake: Handshake = this.handshakes.find((obj) => {
			return (obj.match.player1.socket.id === client.id
				|| obj.match.player2.socket.id === client.id);
		});
		return handshake;
	}

	private findUserRoomIndex(client: Socket): number {
		const index: number = this.game_rooms.findIndex((obj) => {
			return obj.isClientInRoom(client);
		});
		return index;
	}


//	/* -- ROOM MANIPULATION --------------------- */
//	public joinRoom(user: Client): GameRoom {
//		if (this.findUserRoom(user) !== undefined) {
//			throw 'User already in a room';
//		}
//		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
//			return (obj.name === user);
//		});
//		// If room doesn't already exists, create it
//		if (room === undefined)
//			return this.createRoom(user);
//		// No spectator system yet
//		room.addGuest(user);
//		return room;
//	}
//
//	public leaveRoom(client: Client): GameRoom {
//		const room: GameRoom | undefined = this.findUserRoom(client);
//		if (room === undefined)
//			throw 'Not in a room';
//		const is_empty: boolean = room.removeUser(client);
//		if (is_empty) {
//			console.info(`Room ${room.name} is empty`);
//			this.removeRoom(room.name);
//		}
//		return room;
//	}
//
//	public removeRoom(room_name: string): void {
//		const index: number = this.game_rooms.findIndex((obj) => {
//			return (room_name === obj.name);
//		});
//		if (index >= 0)
//			this.game_rooms.splice(index, 1);
//	}
//
//	public initialize(room: GameRoom): Ball {
//		// TODO: Database save room info (players, start etc)
//		// create first update
//		const ball: Ball = room.startGame();
//	}
//
//	/* == PRIVATE ================================================================================= */
//
//	/* -- UTILS --------------------------------- */
//	private findUserRoom(client: Client): GameRoom | undefined {
//		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
//			return obj.isClientInRoom(client);
//		});
//		return room;
//	}
//
//	private createRoom(user: Client): GameRoom {
//		console.info("Create room:", user);
//		const room: GameRoom = new GameRoom(user);
//		this.game_rooms.push(room);
//		return room;
//	}

}
