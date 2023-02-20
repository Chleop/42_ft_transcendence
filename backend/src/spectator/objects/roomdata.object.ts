// import { IUserPublic } from "../user/interface";
import { GameRoom } from "src/game/rooms";
import { IUserPublic } from "../../user/interface";
// import { PlayerInfos } from "../objects";

/**
 * Holds each players of a game room datas (login, avatar, etc).
 */
export class RoomData {
	public readonly spectated: IUserPublic;
	public readonly opponent: IUserPublic;

	constructor(spectated: IUserPublic, room: GameRoom) {
		this.spectated = spectated;
		this.opponent = room.match.player2.data.user;
	}
}
