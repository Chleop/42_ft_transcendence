import { t_channels_fields, t_channels_fields_tmp } from "src/user/alias";

export type t_get_one_fields = {
	id: string;
	login: string;
	name: string;
	skin_id: string;
	elo: number;
	channels: t_channels_fields[];
	games_played: number;
	games_won: number;
};

export type t_get_one_fields_tmp = {
	id: string;
	login: string;
	name: string;
	skinId: string;
	elo: number;
	channels: t_channels_fields_tmp[];
	gamesPlayed: t_games_fields_tmp[];
	gamesWon: t_games_fields_tmp[];
};

type t_games_fields_tmp = {
	id: string;
};
