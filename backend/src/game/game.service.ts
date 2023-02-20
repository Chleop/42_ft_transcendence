import { Injectable, Logger, BadRequestException, ConflictException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { Socket } from "socket.io";
import { GameRoom } from "./rooms";
import { Match } from "./aliases";
import { Results, OpponentUpdate } from "./objects";
import { Matchmaking } from "./matchmaking";
import { BadEvent, WrongData } from "./exceptions";

/**
 * Game rooms manager.
 *
 * Holds the matchmaking unit.
 */
@Injectable()
export class GameService {
	private readonly prisma_service: PrismaService;
	private game_rooms: Set<GameRoom>;
	private readonly matchmaking: Matchmaking;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor(prisma: PrismaService) {
		this.prisma_service = prisma;
		this.matchmaking = new Matchmaking();
		this.game_rooms = new Set<GameRoom>();
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
			this.logger.log(`Saved game '${room.match.name}' to database`);
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
			throw error;
		}
		return match;
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Trying to match client with another player.
	 */
	public queueUp(client: Socket): GameRoom | null {
		try {
			this.findUserGame(client.data.user.id);
			throw new BadEvent("Player already in game");
		} catch (e) {
			if (e instanceof BadEvent) throw e;
		}
		this.logger.verbose(`${client.data.user.login} entering matchmaking.`);
		const new_game_room: GameRoom | null = this.matchmaking.queueUp(client);
		if (new_game_room === null) {
			this.logger.verbose(`${client.data.user.login} was queued up.`);
			return null;
		}

		this.logger.verbose(`Room ${new_game_room.match.name} created.`);

		this.game_rooms.add(new_game_room);
		return new_game_room;
	}

	/**
	 * Removes a player from the queue.
	 */
	public unQueue(client: Socket): GameRoom | null {
		this.logger.verbose(`User ${client.data.user.login} is being unqueued`);

		/* Client was in matchmaking */
		if (this.matchmaking.unQueue(client)) return null;

		const room: GameRoom | null = this.findUserRoom(client);

		/* Client is not in a gameroom */
		if (room === null) return null;

		/* Client was in an ongoing game */
		if (room.is_ongoing) {
			this.logger.verbose(`Game '${room.match.name}' was ongoing`);
			return room;
		}
		return null;
	}

	/**
	 * Removes game room from list.
	 */
	public destroyRoom(room: GameRoom): void {
		if (this.game_rooms.delete(room)) this.logger.verbose(`Destroying room ${room.match.name}`);
	}

	/**
	 * Updates received paddle.
	 *
	 * Returns updated paddle and the opponent of the sender.
	 */
	public updateOpponent(client: Socket): OpponentUpdate {
		const room: GameRoom | null = this.findUserRoom(client);
		if (room === null) throw new BadEvent("Paddle update received but not in game");
		return room.updatePaddle(client);
	}

	/**
	 * Returns game room with associated user_id.
	 */
	public findUserGame(user_id: string): GameRoom {
		for (const obj of this.game_rooms) {
			if (
				obj.match.player1.data.user.id === user_id ||
				obj.match.player2.data.user.id === user_id
			)
				return obj;
		}
		throw new WrongData("Room does not exist");
	}

	/* PRIVATE ================================================================= */

	/**
	 * Returns room if client is in it.
	 */
	private findUserRoom(client: Socket): GameRoom | null {
		for (const obj of this.game_rooms) {
			if (obj.isSocketInRoom(client)) return obj;
		}
		return null;
	}
}
