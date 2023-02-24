import { IUserPublic } from "../../user/interface";

export type RoomData = {
	spectated: IUserPublic;
	opponent: IUserPublic;
};

// import { GameRoom } from "src/game/rooms";
// import { IUserPrivate, IUserPublic } from "../../user/interface";

// /**
//  * Holds each players of a game room datas (login, avatar, etc).
//  */
// export class RoomData {
// 	public readonly spectated: IUserPublic;
// 	public readonly opponent: IUserPublic;

// 	/* CONSTRUCTOR ============================================================= */

// 	constructor(spectated_user: IUserPublic, enemy: IUserPublic) {}
// 	// constructor(spectated_id: string, room: GameRoom) {
// 		// const player1: IUserPublic = this._downgrade_user_data(room.match.player1.data.user);
// 		// const player2: IUserPublic = this._downgrade_user_data(room.match.player2.data.user);
// 		// if (room.match.player1.data.user.id === spectated_id) {
// 		// 	this.spectated = player1;
// 		// 	this.opponent = player2;
// 		// } else {
// 		// 	this.spectated = player2;
// 		// 	this.opponent = player1;
// 		// }
// 	}

// 	/* PRIVATE ================================================================= */

// 	/**
// 	 * Downgrade to IUserPublic
// 	 */
// 	private _downgrade_user_data(user: IUserPrivate): IUserPublic {
// 		return {
// 			id: user.id,
// 			name: user.name,
// 			skin_id: user.skin_id,
// 			games_played_count: user.games_played_count,
// 			games_won_count: user.games_won_count,
// 			status: user.status,
// 		};
// 	}
// }
