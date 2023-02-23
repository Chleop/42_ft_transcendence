import { e_user_status } from "../enum";

export interface IUserPublic {
	id: string;
	name: string;
	skin_id: string;
	games_played_count: number;
	games_won_count: number;
	status: e_user_status;
}

export interface IUserPublicTmp {
	id: string;
	name: string;
	skinId: string;
	games_played_as_player0: IGamesPlayed[];
	games_played_as_player1: IGamesPlayed[];
	gamesWon: IGamesWon[];
}

interface IGamesPlayed {
	id: string;
}

interface IGamesWon {
	id: string;
}
