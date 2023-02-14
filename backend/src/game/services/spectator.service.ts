import { GameRoom, SpectatedRoom } from "../rooms";
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	InternalServerErrorException,
	StreamableFile,
} from "@nestjs/common";
import { UserService } from "src/user/user.service";
import { PlayerInfos } from "../objects";
import { Socket } from "socket.io";
import { RoomData } from "../aliases";
import { UserNotFoundError, UserNotLinkedError } from "src/user/error";

/**
 * Spectated rooms handler.
 */
@Injectable()
export class SpectatorService {
	private readonly user_service: UserService;
	private rooms: SpectatedRoom[];

	/* CONSTRUCTOR ============================================================= */

	constructor(user_service: UserService) {
		this.user_service = user_service;
		this.rooms = [];
	}

	/* PUBLIC ================================================================== */

	/**
	 * Retrieves each players infos, to be sent to the spectator.
	 */
	public async retrieveRoomData(game_room: GameRoom): Promise<RoomData> {
		try {
			const player1: Socket = game_room.match.player1;
			const player2: Socket = game_room.match.player2;
			const avatar1: StreamableFile = await this.user_service.get_ones_avatar(
				player1.data.user.id,
				player1.data.user.id,
			);
			const avatar2: StreamableFile = await this.user_service.get_ones_avatar(
				player2.data.user.id,
				player2.data.user.id,
			);

			const player_infos1: PlayerInfos = new PlayerInfos(player1.data.user, avatar1);
			const player_infos2: PlayerInfos = new PlayerInfos(player2.data.user, avatar2);
			return { player1: player_infos1, player2: player_infos2 };
		} catch (e) {
			if (e instanceof UserNotFoundError) {
				throw new BadRequestException(e.message);
			} else if (e instanceof UserNotLinkedError) {
				throw new ForbiddenException(e.message);
			}
			throw new InternalServerErrorException();
		}
	}

	/**
	 * Observes a new room.
	 */
	public add(new_room: SpectatedRoom): void {
		this.rooms.push(new_room);
	}

	/**
	 * Removes a streaming room.
	 */
	public destroyRoom(room_name: string): void {
		const index: number = this.getRoomIndex(room_name);
		if (index < 0) return;
		clearInterval(this.rooms[index].ping_id);
		this.rooms.splice(index, 1);
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Returns room by name.
	 */
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
