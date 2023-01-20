import { GameRoom } from "../room";
import { Socket } from "socket.io";

export class SpectatedRoom {
	// public name: string;
	public readonly game_room: GameRoom;
	public ping_id: NodeJS.Timer;
	// public number_spectator: number;
	public spectators: Socket[];

	constructor(room: GameRoom, id: NodeJS.Timer) {
		// this.name = name;
		this.game_room = room;
		this.ping_id = id;
		this.spectators = [];
		// this.number_spectator = 1;
	}

	public addSpectator(client: Socket): void {
		this.spectators.push(client);
	}

	public removeSpectator(client: Socket): void {
		const index: number = this.spectators.findIndex((obj) => {
			return obj.id === client.id;
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
