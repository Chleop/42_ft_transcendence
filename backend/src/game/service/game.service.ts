import { Socket } from "socket.io";
import { GameRoom } from "../room";
import { AntiCheat, Client, Match } from "../aliases";
import { PaddleDto } from "../dto";
import { ResultsObject } from "../objects";
// import { PrismaService } from "../prisma/prisma.service";
// import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
// import { BadRequestException, ConflictException } from "@nestjs/common";

/* TODO: implement better MM */

/* Track match made */
type Handshake = {
	// The two matched players
	match: Match;
};

/* Matchmaking class */
/* Manage rooms, save scores in database */
export class GameService {
	// private prisma: PrismaService;
	private game_rooms: GameRoom[];
	private handshakes: Handshake[];
	// TODO: extend queue
	private queue: Client | null;

	constructor() {
		// this.prisma = new PrismaService();
		this.game_rooms = [];
		this.handshakes = [];
		this.queue = null;
	}

	/* == PUBLIC ================================================================================ */

	/* -- DATABASE LINKING ---------------------------------------------------- */
	// TODO get user infos in db
	public decode(jwt: string): { id: string } {
		// UserData
		return {
			id: jwt,
		};
	}

	// TODO save score to db
	public saveScore(room: GameRoom, results: ResultsObject | null): Match {
		const match: Match = room.match;
		try {
			if (results) console.log("Scores:", results);
			else console.log(`Game ${results} cut short before it started`);
		} catch (e) {
			console.log(e);
		}
		this.destroyRoom(room);
		return match;
	}

	// public async registerGameHistory(room: GameRoom, results: ResultsObject): Promise<Match> {
	// 	const match: Match = room.match;
	// 	try {
	// 		/*const user = */await this.prisma.game.create({
	// 			data: {
	// 				players: {
	// 					connect: [{ id: match.player1.id }, { id: match.player2.id }],
	// 				},
	// 				winner: {
	// 					connect: {
	// 						id: results.player1.winner ? match.player1.id : match.player2.id,
	// 					},
	// 				},
	// 				scores: [results.player1.score, results.player2.score],
	// 				datetime: results.dateTime,
	// 			},
	// 		});
	// 	} catch (error) {
	// 		if (error instanceof PrismaClientKnownRequestError) {
	// 			switch (error.code) {
	// 				case "P2002":
	// 					throw new ConflictException("One of the provided fields is unavailable");
	// 				case "P2025":
	// 					throw new BadRequestException(
	// 						"One of the relations you tried to connect to does not exist",
	// 					);
	// 			}
	// 			console.log(error.code);
	// 		}
	// 		throw error;
	// 	}
	// 	this.destroyRoom(room);
	// 	return match;
	// }

	/* -- MATCHMAKING --------------------------------------------------------- */
	public queueUp(user: Client): Match | null {
		if (this.queue === null) {
			this.queue = user;
			return null;
		}
		const match: Match = {
			name: this.queue.socket.id + user.socket.id,
			player1: this.queue,
			player2: user,
		};
		this.queue = null;
		this.handshakes.push({
			match: match,
			// shook: false,
		});
		return match;
	}

	public unQueue(client: Socket): Match | null {
		if (this.queue && this.queue.socket.id === client.id) {
			this.queue = null;
		} else {
			// The match wasn't accepted yet
			const handshake: Handshake | undefined = this.findUserMatch(client);
			if (handshake !== undefined) {
				const match: Match = handshake.match;
				this.ignore(handshake.match);
				return match;
			}
			// The game was ongoing
			const index: number = this.findUserRoomIndex(client);
			if (!(index < 0)) {
				console.log("Kicked from room");
				const room: GameRoom = this.game_rooms[index];
				const match: Match = this.saveScore(
					room,
					room.cutGameShort(room.playerNumber(client)),
				);
				return match;
			}
		}
		return null;
	}

	/* -- ROOM MANIPULATION --------------------------------------------------- */
	public createRoom(match: Match): GameRoom {
		const room: GameRoom = new GameRoom(match);
		this.game_rooms.push(room);
		this.ignore(match);
		return room;
	}

	public ignore(match: Match): void {
		const index: number = this.handshakes.findIndex((obj) => {
			return obj.match.name === match.name;
		});
		if (index < 0) throw "Cannot ignore a match not made";
		this.handshakes.splice(index, 1);
	}

	public destroyRoom(index: number | GameRoom): void {
		if (typeof index !== "number") {
			const new_index: number = this.game_rooms.indexOf(index);
			if (new_index < 0) return;
			console.log(`Destroying room ${index.match.name}`);
			index.destroyPlayerPing();
			this.game_rooms.splice(new_index, 1);
		} else {
			if (index < 0) return;
			console.log(`Destroying room ${this.game_rooms[index].match.name}`);
			this.game_rooms[index].destroyPlayerPing();
			this.game_rooms.splice(index, 1);
		}
	}

	/* -- GAME UPDATING ------------------------------------------------------- */
	public updateOpponent(client: Socket, dto: PaddleDto): AntiCheat {
		const index: number = this.findUserRoomIndex(client);
		if (index < 0) throw "Paddle update received but not in game";
		return this.game_rooms[index].updatePaddle(client, dto);
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getUser(sock: Socket, authkey: string): Client {
		if (authkey !== "abc") throw "Wrong key";
		return {
			socket: sock,
			id: "xyz", // jwt token
		};
	}

	public display(): void {
		console.log({
			queue: this.queue?.id,
			headers: this.queue?.socket.handshake,
			handshakes: this.handshakes,
			rooms: this.game_rooms,
		});
	}

	public findUserGame(spectator: Socket): GameRoom | null {
		const user_id: string | string[] | undefined = spectator.handshake.headers.socket_id;
		if (typeof user_id !== "string") throw "Room not properly specified";
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return obj.match.player1.id === user_id || obj.match.player2.id === user_id;
		});
		if (room === undefined) return null;
		return room;
		/* const cookies_raw = spectator.handshake.headers.cookie;
		if (cookies_raw === undefined) throw "Cookie undefined";
		const user_id: string = cookie.parse(cookies_raw).friend_id;
		if (user_id === undefined) throw "No friend_id defined";
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return obj.match.player1.id === user_id || obj.match.player2.id === user_id;
		});
		if (room === undefined) return null;
		return room; */
	}

	/* == PRIVATE =============================================================================== */

	/* -- UTILS --------------------------------------------------------------- */
	private findUserMatch(client: Socket): Handshake | undefined {
		const handshake: Handshake | undefined = this.handshakes.find((obj) => {
			return (
				obj.match.player1.socket.id === client.id ||
				obj.match.player2.socket.id === client.id
			);
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
