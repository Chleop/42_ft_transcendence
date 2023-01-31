import { GameRoom } from "../rooms";
import { AntiCheat, Match } from "../aliases";
import { PaddleDto } from "../dto";
import { Results } from "../objects";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Socket } from "socket.io";

/* TODO: implement better MM */

/* Matchmaking class */
/* Manage rooms, save scores in database */
@Injectable()
export class GameService {
	private prisma_service: PrismaService;
	private game_rooms: GameRoom[];
	private matches: Match[];
	// TODO: extend queue
	private queue: Socket | null;

	/* CONSTRUCTOR ============================================================= */

	constructor(prisma: PrismaService) {
		this.prisma_service = prisma;
		this.game_rooms = [];
		this.matches = [];
		this.queue = null;
	}

	/* == PUBLIC ================================================================================ */

	// TODO replace
	public saveScore(room: GameRoom, results: Results | null): Match {
		const match: Match = room.match;
		try {
			console.log(`Game ${results} cut short before it started`);
		} catch (e) {
			console.log(e);
		}
		this.destroyRoom(room);
		return match;
	}

	public async registerGameHistory(room: GameRoom, results: Results): Promise<Match> {
		const match: Match = room.match;
		try {
			/*const user = */ await this.prisma_service.game.create({
				data: {
					players: {
						connect: [
							{ id: match.player1.handshake.auth.token },
							{ id: match.player2.handshake.auth.token },
						],
					},
					winner: {
						connect: {
							id: results.player1.winner
								? match.player1.handshake.auth.token
								: match.player2.handshake.auth.token,
						},
					},
					scores: [results.player1.score, results.player2.score],
					dateTime: new Date(results.date),
				},
			});
		} catch (error) {
			if (error instanceof PrismaClientKnownRequestError) {
				switch (error.code) {
					case "P2002":
						throw new ConflictException("One of the provided fields is unavailable");
					case "P2025":
						throw new BadRequestException(
							"One of the relations you tried to connect to does not exist",
						);
				}
				console.log(error.code);
			}
			throw error;
		}
		this.destroyRoom(room);
		return match;
	}

	/* -- MATCHMAKING --------------------------------------------------------- */
	public queueUp(user: Socket): Match | null {
		if (this.queue === null) {
			this.queue = user;
			return null;
		}
		const match: Match = {
			name: this.queue.handshake.auth.token + user.handshake.auth.token,
			player1: this.queue,
			player2: user,
		};
		this.queue = null;
		this.matches.push(match);
		return match;
	}

	public unQueue(client: Socket): Match | null {
		if (this.queue && this.queue.handshake.auth.token === client.handshake.auth.token) {
			this.queue = null;
		} else {
			// The match wasn't accepted yet
			const match: Match | undefined = this.findUserMatch(client);
			if (match !== undefined) {
				this.ignore(match);
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
	public display(): void {
		console.log({
			queue: this.queue?.handshake.auth.token,
			headers: this.queue?.handshake,
			matches: this.matches,
			rooms: this.game_rooms,
		});
	}

	public findUserGame(spectator: Socket): GameRoom | null {
		const data: string | undefined = spectator.data.user_id;
		if (typeof data !== "string") return null; //throw "Room not properly specified";
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return (
				obj.match.player1.handshake.auth.token === data ||
				obj.match.player2.handshake.auth.token === data
			);
		});
		if (room === undefined) return null;
		return room;
	}

	/* == PRIVATE =============================================================================== */

	/* -- UTILS --------------------------------------------------------------- */
	private findUserMatch(client: Socket): Match | undefined {
		const handshake: Match | undefined = this.matches.find((obj) => {
			return (
				obj.player1.handshake.auth.token === client.handshake.auth.token ||
				obj.player2.handshake.auth.token === client.handshake.auth.token
			);
		});
		return handshake;
	}

	private ignore(match: Match): void {
		const index: number = this.matches.findIndex((obj) => {
			return obj.name === match.name;
		});
		if (index < 0) throw "Cannot ignore a match not made";
		this.matches.splice(index, 1);
	}

	private findUserRoomIndex(client: Socket): number {
		const index: number = this.game_rooms.findIndex((obj) => {
			return obj.isSocketInRoom(client);
		});
		return index;
	}
}
