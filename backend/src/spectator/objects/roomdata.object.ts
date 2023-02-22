import { GameRoom } from "src/game/rooms";
import { IUserPrivate, IUserPublic } from "../../user/interface";

/**
 * Holds each players of a game room datas (login, avatar, etc).
 */
export class RoomData {
	public readonly spectated: IUserPublic;
	public readonly opponent: IUserPublic;

	constructor(spectated_id: string, room: GameRoom) {
		if (room.match.player1.data.user.id === spectated_id) {
			this.spectated = this._downgrade_user_data(room.match.player1.data.user);
			this.opponent = this._downgrade_user_data(room.match.player2.data.user);
		} else {
			this.spectated = this._downgrade_user_data(room.match.player2.data.user);
			this.opponent = this._downgrade_user_data(room.match.player1.data.user);
		}
	}

	private _downgrade_user_data(user: IUserPrivate): IUserPublic {
		return {
			id: user.id,
			name: user.name,
			skin_id: user.skin_id,
			games_played_count: user.games_played_count,
			games_won_count: user.games_won_count,
			status: user.status,
		};
	}
}
