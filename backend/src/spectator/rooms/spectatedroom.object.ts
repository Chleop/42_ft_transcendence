import { Socket } from "socket.io";
import { GameRoom } from "../../game/rooms";

/**
 * Spectated room handler.
 *
 * Stores spectating clients.
 */
export class SpectatedRoom {
	public readonly game_room: GameRoom;
	public spectators: Set<Socket>;
	public ping_id: NodeJS.Timer;

	constructor(room: GameRoom, id: NodeJS.Timer) {
		this.game_room = room;
		this.ping_id = id;
		this.spectators = new Set<Socket>();
	}

	/* PUBLIC ================================================================== */

	public addSpectator(client: Socket): void {
		this.spectators.add(client);
	}

	public removeSpectator(client: Socket): void {
		const spectator: Socket | null = this.findSpectator(client);
		if (spectator === null) return;
		this.spectators.delete(spectator);
	}

	public isEmpty(): boolean {
		if (this.spectators.size === 0) return true;
		return false;
	}

	public getName(): string {
		return this.game_room.match.name;
	}

	/* PRIVATE ================================================================= */

	private findSpectator(client: Socket): Socket | null {
		for (const obj of this.spectators) {
			if (obj.id === client.id) return obj;
		}
		return null;
	}
}
