import { IChannel, IChannelTmp } from "src/channel/interface";
import { t_user_status } from "src/user/alias";

export type t_get_one_fields = {
	id: string;
	login: string;
	name: string;
	status: t_user_status;
	skin_id: string;
	elo: number;
	channels: IChannel[];
	games_played: number;
	games_won: number;
};

export type t_get_one_fields_tmp = {
	id: string;
	login: string;
	name: string;
	skinId: string;
	elo: number;
	channels: IChannelTmp[];
	gamesPlayed: t_games_fields_tmp[];
	gamesWon: t_games_fields_tmp[];
};

type t_games_fields_tmp = {
	id: string;
};
