import { GameRoom } from "src/game/rooms";
import { IUserPublic } from "../../user/interface";

/**
 * Holds each players of a game room datas (login, avatar, etc).
 */
export class RoomData {
	public readonly spectated: IUserPublic;
	public readonly opponent: IUserPublic;

	constructor(spectated_id: string, room: GameRoom) {
		/**
		 * TODO:
		 * 	FAIRE LE TRI (au lieu de juste faire x = y, faire x = {y.field1, etc bref})
		 */
		if (room.match.player1.data.user.id === spectated_id) {
			this.spectated = room.match.player1.data.user;
			this.opponent = room.match.player2.data.user;
		} else {
			this.spectated = room.match.player2.data.user;
			this.opponent = room.match.player1.data.user;
		}
	}
}
