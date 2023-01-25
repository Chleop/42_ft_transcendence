import { Injectable } from "@nestjs/common";
import { SpectatedRoom } from "../rooms";

@Injectable()
export class SpectateService {
	private rooms: SpectatedRoom[];

	constructor() {
		this.rooms = [];
	}

	public add(new_room: SpectatedRoom): void {
		this.rooms.push(new_room);
	}

	public destroyRoom(room_name: string): void {
		const index: number = this.getRoomIndex(room_name);
		if (index < 0) return;
		console.log(`Room ${this.rooms[index].getName()} destroyed`);
		clearInterval(this.rooms[index].ping_id);
		this.rooms.splice(index, 1);
	}

	public getRoom(name: string): SpectatedRoom | null {
		const room: SpectatedRoom | undefined = this.rooms.find((obj) => {
			return obj.getName() === name;
		});
		if (room === undefined) return null;
		return room;
	}

	public getRoomIndex(name: string): number {
		return this.rooms.findIndex((obj) => {
			return obj.getName() === name;
		});
	}
}
