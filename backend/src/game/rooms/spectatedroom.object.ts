import { Socket } from "socket.io";
import { GameRoom } from ".";

/**
 * Spectated room handler.
 *
 * Stores spectating clients.
 */
export class SpectatedRoom {
	public readonly game_room: GameRoom;
	public spectators: Socket[];
	public ping_id: NodeJS.Timer;

	constructor(room: GameRoom, id: NodeJS.Timer) {
		this.game_room = room;
		this.ping_id = id;
		this.spectators = [];
	}

	/* PUBLIC ================================================================== */

	public addSpectator(client: Socket): void {
		this.spectators.push(client);
	}

	public removeSpectator(client: Socket): void {
		const index: number = this.spectators.findIndex((obj) => {
			return obj.data.user.id === client.data.user.id;
		});
		if (index < 0) return;
		this.spectators.splice(index, 1);
	}

	public isEmpty(): boolean {
		if (this.spectators.length === 0) return true;
		return false;
	}

	public getName(): string {
		return this.game_room.match.name;
	}
}
