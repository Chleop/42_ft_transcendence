import { Socket } from "socket.io";
import { GameRoom } from "./room";
import { AntiCheat, Client, Match } from "./aliases";
import { PaddleDto } from "./dto";
import { ResultsObject } from "./objects";
// import { PrismaService } from "../prisma/prisma.service";
// import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
// import { BadRequestException, ConflictException } from "@nestjs/common";

/* TODO: implement better MM */

/* Track match made */
type Handshake = {
	// The two matched players
	match: Match;

	// If hands were shook
	// shook: boolean;
};

/* Matchmaking class */
/* Manage rooms, save scores in database */
export class GameService {
	// private prisma: PrismaService;
	private game_rooms: GameRoom[];
	private handshakes: Handshake[];
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
			if (results) console.info("Scores:", results);
			else console.info(`Game ${results} cut short before it started`);
		} catch (e) {
			console.info(e);
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
				console.info("Kicked from room");
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

	// public playerAcknowledged(client: Socket): GameRoom | null {
	// 	const handshake: Handshake | undefined = this.findUserMatch(client);
	// 	if (handshake === undefined)
	// 		// Tried to send ok before room creation/once game started
	// 		throw "Received matchmaking acknowledgement but not awaiting";
	// 	console.info(`${client.id} accepted`);
	// 	if (handshake.shook) return this.createRoom(handshake.match);
	// 	handshake.shook = true;
	// 	return null;
	// }

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
			console.info(`Destroying room ${index.match.name}`);
			index.destroyPing();
			this.game_rooms.splice(new_index, 1);
		} else {
			if (index < 0) return;
			console.info(`Destroying room ${this.game_rooms[index].match.name}`);
			this.game_rooms[index].destroyPing();
			this.game_rooms.splice(index, 1);
		}
	}

	/* -- GAME UPDATING ------------------------------------------------------- */
	public updateOpponent(client: Socket, dto: PaddleDto): AntiCheat | null {
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
		console.info({
			handshakes: this.handshakes,
			rooms: this.game_rooms,
		});
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
