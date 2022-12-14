import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameRoom } from './room';
import {
	GameUpdate,
	Score,
	Client,
	Match
} from './aliases';
import { PaddleDto } from './dto';

/* For now, gamerooms are named after a name given in the dto
	 Bound to be named after the host once we manage the jwt/auth token. */

/* Track match made */
type Handshake = {
	// The two matched players
	match: Match,

	// If one shook hands
	one: boolean
};

/* Matchmaking class */
/* Manage rooms, save scores in database */
@Injectable()
export class GameService {
	private game_rooms: GameRoom[] = [];
	private handshakes: Handshake[] = [];
	private queue: Client = null;

	/* == PUBLIC ================================================================================== */

	/* -- HANDSHAKES MANAGING ------------------- */
	public queueUp(user: Client): Match | null {
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

	public playerAcknowledged(client: Socket): GameRoom | null {
		const handshake: Handshake = this.findUserMatch(client);
		if (handshake === undefined) // Tried to send ok before room creation/once game started
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

	/* -- UTILS --------------------------------- */
	public getUser(sock: Socket, authkey: string): Client {
		if (authkey !== 'abc')
			throw 'Wrong key';
		return {
			socket: sock,
			id: 'xyz'
		};
	}

	public display(): void {
		console.info({
			handshakes: this.handshakes,
			rooms: this.game_rooms
		});
	}

	/* -- ROOM MANIPULATION --------------------- */
	public updateOpponent(client: Socket, dto: PaddleDto): GameUpdate {
		const index: number = this.findUserRoomIndex(client);
		if (index < 0)
			return null;
		return this.game_rooms[index].getUpdate();
	}

	/* == PRIVATE ================================================================================= */

	/* -- ROOM MANIPULATION --------------------- */
	private createRoom(match: Match): GameRoom {
		const room: GameRoom = new GameRoom(match);
		this.game_rooms.push(room);
		this.ignore(match);
		return room;
	}

	private destroyRoom(index: number): void {
		this.game_rooms.splice(index, 1);
	}

	/* -- DATABASE LINKING ---------------------- */
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

	/* -- UTILS --------------------------------- */
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

}
