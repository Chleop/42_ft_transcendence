import { Socket } from "socket.io";
import { Match } from "../aliases";
import { GameRoom } from "../rooms";
import { BadEvent } from "../exceptions";

/**
 * Matchmaking handler.
 *
 * Single spot as a queue.
 * When it is taken, matches with incomming connection.
 * Otherwise, they take this spot.
 */
export class Matchmaking {
	private queue: Socket | null;

	/* CONSTRUCTOR ============================================================= */

	constructor() {
		this.queue = null;
	}

	/* PUBLIC ================================================================== */

	/**
	 * Puts client in the queue if it's empty.
	 * Else, client is matched with queue and a new game room is returned.
	 */
	public queueUp(client: Socket): GameRoom | null {
		if (this.queue === null) {
			this.queue = client;
			return null;
		} else {
			if (this.queue.data.user.id === client.data.user.id)
				throw new BadEvent("Client already in the queue");
			const match: Match = {
				name: this.queue.handshake.auth.token + client.handshake.auth.token,
				player1: this.queue,
				player2: client,
			};
			const new_game_room: GameRoom = new GameRoom(match);
			this.queue = null;
			return new_game_room;
		}
	}

	/**
	 * Removes the person from the queue.
	 */
	public unQueue(client: Socket): boolean {
		if (this.queue?.handshake.auth.token === client.handshake.auth.token) {
			this.queue = null;
			return true;
		}
		return false;
	}
}
