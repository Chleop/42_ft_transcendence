import { ChanType } from "@prisma/client";
import { t_channels_fields } from "src/user/alias";

export type t_get_one_fields = {
	id: string;
	name: string;
	skin_id: string;
	elo: number;
	channels: t_channels_fields[];
	games_played_ids: string[];
	games_won_ids: string[];
};

export type t_get_one_fields_tmp = {
	id: string;
	name: string;
	skinId: string;
	elo: number;
	channels: t_channels_fields_tmp[];
	gamesPlayed: t_games_fields_tmp[];
	gamesWon: t_games_fields_tmp[];
};

type t_channels_fields_tmp = {
	id: string;
	name: string;
	chanType: ChanType;
};

type t_games_fields_tmp = {
	id: string;
};
