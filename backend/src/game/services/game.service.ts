import { Injectable, Logger } from "@nestjs/common";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { Socket } from "socket.io";
import { GameRoom } from "../rooms";
import { Match } from "../aliases";
import { Results, OpponentUpdate } from "../objects";
import { PrismaService } from "src/prisma/prisma.service";
import { Matchmaking } from "../matchmaking";

/**
 * Game rooms manager.
 *
 * Holds the matchmaking unit.
 */
@Injectable()
export class GameService {
	private readonly prisma_service: PrismaService;
	private game_rooms: GameRoom[];
	private readonly matchmaking: Matchmaking;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(prisma: PrismaService) {
		this.prisma_service = prisma;
		this.matchmaking = new Matchmaking();
		this.game_rooms = [];
		this.logger = new Logger(GameService.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * Registers finished game to database
	 */
	public async registerGameHistory(room: GameRoom, results: Results): Promise<Match> {
		const match: Match = room.match;
		try {
			await this.prisma_service.game.create({
				data: {
					players: {
						connect: [
							{ id: match.player1.data.user.id },
							{ id: match.player2.data.user.id },
						],
					},
					winner: {
						connect: {
							id: results.winner,
						},
					},
					scores: [results.scores.player1_score, results.scores.player2_score],
					dateTime: new Date(results.date),
				},
			});
			this.logger.verbose(`Saved game '${room.match.name}' to database`);
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
			}
			this.logger.error(error);
			throw error;
		}
		return match;
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Trying to match client with another player.
	 */
	public queueUp(client: Socket): GameRoom | null {
		const index: number = this.findUserRoomIndex(client);
		if (index >= 0) throw "Player already in game";
		const new_game_room: GameRoom | null = this.matchmaking.queueUp(client);
		if (new_game_room === null) return null;
		this.logger.verbose(`Room ${new_game_room.match.name} created.`);
		this.game_rooms.push(new_game_room);
		return new_game_room;
	}

	/**
	 * Removes a player from the queue, or destroys their game room.
	 */
	public async unQueue(client: Socket): Promise<Match | null> {
		// Client has passed matchmaking
		this.logger.verbose(`User ${client.data.user.login} is being unqueued`);
		if (!this.matchmaking.unQueue(client)) {
			const index: number = this.findUserRoomIndex(client);

			// Client is not in a gameroom
			if (index < 0) return null;

			// Client was in an ongoing game

			const room: GameRoom = this.game_rooms[index];
			const results: Results = room.cutGameShort(room.playerNumber(client));
			this.logger.verbose(`Game was cut short: '${room.match.name}'`);

			const match: Match = await this.registerGameHistory(room, results);

			this.destroyRoom(room);
			return match;
		}
		return null;
	}

	/**
	 * Removes game room from list.
	 */
	public destroyRoom(room: GameRoom): void {
		const index: number = this.game_rooms.indexOf(room);
		if (index < 0) return;
		this.logger.verbose(`Destroying room ${room.match.name}`);
		room.destroyPlayerPing();
		this.game_rooms.splice(index, 1);
	}

	/**
	 * Updates received paddle.
	 *
	 * Returns updated paddle and the opponent of the sender.
	 */
	public updateOpponent(client: Socket): OpponentUpdate {
		const index: number = this.findUserRoomIndex(client);
		if (index < 0) throw "Paddle update received but not in game";
		return this.game_rooms[index].updatePaddle(client);
	}

	/**
	 * Returns game room with associated user_id.
	 */
	public findUserGame(user_id: string): GameRoom {
		const room: GameRoom | undefined = this.game_rooms.find((obj) => {
			return (
				obj.match.player1.handshake.auth.token === user_id ||
				obj.match.player2.handshake.auth.token === user_id
			);
		});
		if (room === undefined) throw "Room does not exist";
		return room;
	}

	/* PRIVATE ================================================================= */

	/**
	 * Returns index of room if client is in it.
	 */
	private findUserRoomIndex(client: Socket): number {
		const index: number = this.game_rooms.findIndex((obj) => {
			return obj.isSocketInRoom(client);
		});
		return index;
	}
}
