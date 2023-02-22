import { Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import { Match } from "../aliases";
import { BadEvent, WrongData } from "../exceptions";
import { GameRoom } from "../rooms";

/**
 * TODO:
 * 	toggle bouncing
 */

/**
 * Matchmaking handler.
 *
 * Single spot as a queue.
 * When it is taken, matches with incomming connection.
 * Otherwise, they take this spot.
 */
export class Matchmaking {
	private awaiting_players: Set<Socket>;
	// private queue_bouncy: Socket | null;
	private queue: Socket | null;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor() {
		this.awaiting_players = new Set<Socket>();
		this.queue = null;
		// this.queue_bouncy = null;
		this.logger = new Logger(Matchmaking.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * Puts client in the queue if it's empty.
	 * Else, client is matched with queue and a new game room is returned.
	 */
	public queueUp(client: Socket): GameRoom | { is_invite: boolean } {
		// Client already in the queue
		if (this.queue?.data.user.id === client.data.user.id) {
			throw new BadEvent(`${client.data.user.login} already in the queue`);
		}
		if (client.handshake.auth.friend !== undefined) {
			return this.awaitingFriend(client);
			// if (typeof client.handshake.auth.friend !== "string")
			// 	throw new WrongData("Bad friend data format");

			// const friend: Socket | null = this.findPendingUser(client.handshake.auth.friend);
			// if (friend !== null) {
			// 	// Friend is in queue
			// 	return this.matchWithFriend(client, friend);
			// }

			// const player: Socket | null = this.findPendingUser(client.data.user.id);
			// if (player !== null) {
			// 	// Already awaiting: remove prior invite
			// 	this.awaiting_players.delete(player);
			// }
			// // Awaiting for a friend
			// this.awaiting_players.add(client);
			// this.logger.verbose(`${client.data.user.login} is awaiting ${client.data.user.login}.`);
			// return { is_invite: true };
		} else {
			// Traditional matchmaking
			if (this.queue === null) {
				this.queue = client;
				return { is_invite: false };
			}
			const match: Match = {
				name: this.queue.id + client.id,
				player1: this.queue,
				player2: client,
			};
			const room: GameRoom = new GameRoom(match);
			this.queue = null;
			return room;
		}
	}

	/**
	 * Removes the person from the queue.
	 */
	public unQueue(client: Socket): boolean {
		if (this.queue?.data.user.id === client.data.user.id) {
			this.queue = null;
			return true;
		}
		for (const waiting_sockets of this.awaiting_players) {
			if (waiting_sockets.data.user.id === client.data.user.id) {
				this.awaiting_players.delete(client);
				return true;
			}
		}
		return false;
	}

	/* PRIVATE ================================================================= */

	private awaitingFriend(client: Socket): GameRoom | { is_invite: boolean } {
		if (typeof client.handshake.auth.friend !== "string")
			throw new WrongData("Bad friend data format");

		const friend: Socket | null = this.findPendingUser(client.handshake.auth.friend);
		if (friend !== null) {
			// Friend is in queue
			return this.matchWithFriend(client, friend);
		}

		const player: Socket | null = this.findPendingUser(client.data.user.id);
		if (player !== null) {
			// Already awaiting: remove prior invite
			this.awaiting_players.delete(player);
		}
		// Awaiting for a friend
		this.awaiting_players.add(client);
		this.logger.verbose(`${client.data.user.login} is awaiting ${client.data.user.login}.`);
		return { is_invite: true };
	}

	private matchWithFriend(client: Socket, player: Socket): GameRoom {
		const match: Match = {
			name: player.data.user.id + client.data.user.id,
			player1: player,
			player2: client,
		};
		this.logger.verbose(`Matching ${player.data.user.login} with ${client.data.user.login}`);
		const new_game_room: GameRoom = new GameRoom(match);
		this.awaiting_players.delete(player);
		return new_game_room;
	}

	private findPendingUser(client: string): Socket | null {
		if (typeof client === "string") {
			for (const player of this.awaiting_players) {
				if (player.data.user.id === client) {
					return player;
				}
			}
		}
		return null;
	}
}
