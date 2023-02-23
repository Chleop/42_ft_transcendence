import { Logger } from "@nestjs/common";
import { Socket } from "socket.io";
import { Match } from "../aliases";
import { BadEvent, WrongData } from "../exceptions";
import { GameRoom } from "../rooms";

/**
 * Matchmaking handler.
 *
 * Single spot as a queue for regular matchmaking,
 * special queue if they're awaiting someone.
 * When it is taken, matches with incomming connection.
 * Otherwise, they take this spot.
 */
export class Matchmaking {
	private awaiting_players: Set<Socket>;
	private queue_bouncy: Socket | null;
	private queue: Socket | null;
	private readonly logger: Logger;

	/* CONSTRUCTOR ============================================================= */

	constructor() {
		this.awaiting_players = new Set<Socket>();
		this.queue = null;
		this.queue_bouncy = null;
		this.logger = new Logger(Matchmaking.name);
	}

	/* PUBLIC ================================================================== */

	/**
	 * Puts client in the queue if it's empty, or in the awaiting list and then informs
	 * the gateway that an invite was generated.
	 * Else, client is matched with queue and a new game room is returned.
	 */
	public queueUp(client: Socket): GameRoom | { is_invite: boolean } {
		// Client already in the queue
		if (this.queue?.data.user.id === client.data.user.id ||
			this.queue_bouncy?.data.user.id === client.data.user.id) {
			throw new BadEvent(`${client.data.user.login} already in the queue`);
		}

		if (client.handshake.auth.faithful === undefined)
			throw new WrongData("Missing faithful field");

		if (client.handshake.auth.friend !== undefined) {
			// Inviting friend
			return this.awaitingFriend(client);
		} else {
			// Traditional matchmaking
			return this.regularQueuing(client);
		}
	}

	/**
	 * Removes the person from the queue.
	 */
	public unQueue(client: Socket): boolean {
		if (this.queue?.data.user.id === client.data.user.id) {
			this.queue = null;
			return true;
		} else if (this.queue_bouncy?.data.user.id === client.data.user.id) {
			this.queue_bouncy = null;
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

	/**
	 * Puts client in wanted queue: faithful game or with a twist...
	 */
	private regularQueuing(client: Socket): GameRoom | { is_invite: boolean } {
		const faithful_mode: boolean = client.handshake.auth.faithful;
		let expected_queue: Socket;
		if (faithful_mode) {
			if (this.queue === null) {
				this.queue = client;
				return { is_invite: false };
			}
			expected_queue = this.queue;
			this.queue = null;
		} else {
			if (this.queue_bouncy === null) {
				this.queue_bouncy = client;
				return { is_invite: false };
			}
			expected_queue = this.queue_bouncy;
			this.queue_bouncy = null;
		}
		const match: Match = {
			name: expected_queue.id + client.id,
			player1: expected_queue,
			player2: client,
		};
		return new GameRoom(match, faithful_mode);
	}

	/**
	 * Client is put in a special queue, awaiting a friend.
	 */
	private awaitingFriend(client: Socket): GameRoom | { is_invite: boolean } {
		if (typeof client.handshake.auth.friend !== "string")
			throw new WrongData("Bad friend data format");

		const friend: Socket | null = this.findPendingUser(client.handshake.auth.friend);
		if (friend) {
			// Friend is in queue
			return this.matchWithFriend(client, friend);
		}

		const player: Socket | null = this.findPendingUser(client.data.user.id);
		if (player) {
			// Already awaiting: remove prior invite
			this.awaiting_players.delete(player);
		}
		// Awaiting for a friend
		this.awaiting_players.add(client);
		this.logger.verbose(`${client.data.user.login} is awaiting ${client.handshake.auth.friend}.`);
		return { is_invite: true };
	}

	private matchWithFriend(client: Socket, friend: Socket): GameRoom {
		const match: Match = {
			name: friend.data.user.id + client.data.user.id,
			player1: friend,
			player2: client,
		};
		this.logger.verbose(`Matching ${friend.data.user.login} with ${client.data.user.login}`);
		const new_game_room: GameRoom = new GameRoom(match, friend.handshake.auth.faithful);
		this.awaiting_players.delete(friend);
		return new_game_room;
	}

	/**
	 * Explores the set and returns the wanted client.
	 */
	private findPendingUser(client_id: string): Socket | null {
		for (const player of this.awaiting_players) {
			if (player.data.user.id === client_id) {
				return player;
			}
			}
		return null;
	}
}
