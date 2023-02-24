import { Injectable } from "@nestjs/common";
import { GameRoom } from "../game/rooms";
import { SpectatedRoom } from "./rooms";
import { RoomData } from "./aliases";
import { UserService } from "src/user/user.service";
import { IUserPublic } from "src/user/interface";
import { BadEvent } from "src/game/exceptions";
import { UserNotFoundError } from "src/user/error";

/**
 * Spectated rooms handler.
 */
@Injectable()
export class SpectatorService {
	private readonly user_service: UserService;
	private rooms: Set<SpectatedRoom>;

	/* CONSTRUCTOR ============================================================= */

	constructor(user_service: UserService) {
		this.user_service = user_service;
		this.rooms = new Set<SpectatedRoom>();
	}

	/* PUBLIC ================================================================== */

	/**
	 * Retrieves each players infos, to be sent to the spectator.
	 */
	public async retrieveRoomData(spectated_id: string, game_room: GameRoom): Promise<RoomData> {
		try {
			const player1: IUserPublic = await this.user_service.get_one(
				game_room.match.player1.data.user.id,
			);
			const player2: IUserPublic = await this.user_service.get_one(
				game_room.match.player2.data.user.id,
			);

			const spectated: IUserPublic = player1.id === spectated_id ? player1 : player2;
			const opponent: IUserPublic = player1.id === spectated_id ? player2 : player1;
			return {
				spectated,
				opponent,
			};
		} catch (e) {
			if (e instanceof UserNotFoundError) throw new BadEvent(e.message);
			throw e;
		}
	}

	/**
	 * Observes a new room.
	 */
	public add(new_room: SpectatedRoom): void {
		this.rooms.add(new_room);
	}

	/**
	 * Removes a streaming room.
	 */
	public destroyRoom(room_name: string): void {
		const room: SpectatedRoom | null = this.getRoom(room_name);
		if (room === null) return;
		clearInterval(room.ping_id);
		this.rooms.delete(room);
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Returns room by name.
	 */
	public getRoom(name: string): SpectatedRoom | null {
		for (const obj of this.rooms) {
			if (obj.getName() === name) return obj;
		}
		return null;
	}
}
