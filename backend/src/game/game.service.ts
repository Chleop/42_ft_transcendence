import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GameRoom } from './room';
import {
	AntiCheat,
	OpponentUpdate,
	GameUpdate,
	Score,
	Client,
	Match
} from './aliases';
import { PaddleDto } from './dto';
import { ResultsObject } from './objects';

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

	/* -- DATABASE LINKING ---------------------------------------------------- */
	// TODO get user infos in db
	public decode(jwt: string): {id: string} { // UserData
		return {
			id: jwt
		};
	}

	// TODO save score to db
	public saveScore(room: GameRoom, results: ResultsObject | null): Match {
		const match: Match = room.match;
		try {
			if (results)
				console.info("Scores:", results);
			else
				console.info(`Game ${results} cut short before it started`);
		} catch (e) {
			console.info(e);
		}
		this.destroyRoom(room);
		return match;
	}

/* -- MATCHMAKING --------------------------------------------------------- */
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
			const index: number = this.findUserRoomIndex(client);
			if (!(index < 0)) {
				console.info('Kicked');
				const room: GameRoom = this.game_rooms[index];
				const match: Match = this.saveScore(room, room.cutGameShort(room.playerNumber(client)));
				return match;
			}
		}
		return null;
	}

	public playerAcknowledged(client: Socket): GameRoom {
		const handshake: Handshake = this.findUserMatch(client);
		if (handshake === undefined) // Tried to send ok before room creation/once game started
			throw 'Received matchmaking acknowledgement but not awaiting';
		console.info(`${client.id} accepted`);
		if (handshake.one)
				return this.createRoom(handshake.match);
		handshake.one = true;
		return null;
	}

	/* -- ROOM MANIPULATION --------------------------------------------------- */
	public ignore(match: Match): void {
		const index: number = this.handshakes.findIndex((obj) => {
			return (obj.match.name === match.name);
		});
		if (index < 0)
			throw 'Cannot ignore a match not made';
		this.handshakes.splice(index, 1);
	}

	public destroyRoom(index: number | GameRoom): void {
		if (typeof(index) !== 'number') {
			const new_index: number = this.game_rooms.indexOf(index)
			if (new_index < 0)
				return;
			console.info(`Destroying ${index.match.name}`);
			index.destroyPing();
			this.game_rooms.splice(new_index, 1);
		} else {
			if (index < 0)
				return;
			console.info(`Destroying ${this.game_rooms[index].match.name}`);
			this.game_rooms[index].destroyPing();
			this.game_rooms.splice(index, 1);
		}
	}

	/* -- GAME UPDATING ------------------------------------------------------- */
	public updateOpponent(client: Socket, dto: PaddleDto): AntiCheat {
		const index: number = this.findUserRoomIndex(client);
		if (index < 0)
			throw 'Paddle update received but not in game';
		return this.game_rooms[index].updatePaddle(client, dto);
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getUser(sock: Socket, authkey: string): Client {
		if (authkey !== 'abc')
			throw 'Wrong key';
		return {
			socket: sock,
			id: 'xyz' // jwt token
		};
	}

	public display(): void {
		console.info({
			handshakes: this.handshakes,
			rooms: this.game_rooms
		});
	}

	/* == PRIVATE ================================================================================= */

	/* -- ROOM MANIPULATION --------------------------------------------------- */
	private createRoom(match: Match): GameRoom {
		const room: GameRoom = new GameRoom(match);
		this.game_rooms.push(room);
		this.ignore(match);
		return room;
	}

	/* -- UTILS --------------------------------------------------------------- */
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
