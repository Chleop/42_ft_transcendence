import { Socket } from "socket.io";
import { Match } from "../aliases";
import { GameRoom } from "../rooms";

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
	 * If the queue is empty, client takes its place.
	 * Else, client is matched with queue and a room is created.
	 */
	public queueUp(client: Socket): GameRoom | null {
		if (!this.queue) {
			this.queue = client;
			return null;
		} else {
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

	public unQueue(client: Socket): boolean {
		if (this.queue?.handshake.auth.token === client.handshake.auth.token) {
			this.queue = null;
			return true;
		}
		return false;
	}
}
