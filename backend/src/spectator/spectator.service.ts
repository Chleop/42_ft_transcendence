import { Injectable } from "@nestjs/common";
import { GameRoom } from "../game/rooms";
import { SpectatedRoom } from "./rooms";
import { RoomData } from "./objects";
// import { Socket } from "socket.io";
// import { IUserPrivate } from "src/user/interface";

/**
 * Spectated rooms handler.
 */
@Injectable()
export class SpectatorService {
	private rooms: Set<SpectatedRoom>;

	/* CONSTRUCTOR ============================================================= */

	constructor() {
		this.rooms = new Set<SpectatedRoom>();
	}

	/* PUBLIC ================================================================== */

	/**
	 * Retrieves each players infos, to be sent to the spectator.
	 */
	public retrieveRoomData(spectated_id: string, game_room: GameRoom): RoomData {
		// try {
		// const player1: Socket = game_room.match.player1;
		// const player2: Socket = game_room.match.player2;
		// if (player1.data.user.id === spectated_id)
		return new RoomData(spectated_id, game_room);
		// return { player1: player_infos1, player2: player_infos2 };
		// } catch (e) {
		// 	if (e instanceof UserNotFoundError) {
		// 		throw new BadRequestException(e.message);
		// 	} else if (e instanceof UserNotLinkedError) {
		// 		throw new ForbiddenException(e.message);
		// 	}
		// 	throw new InternalServerErrorException();
		// }
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
