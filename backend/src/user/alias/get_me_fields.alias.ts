import { ChanType } from "@prisma/client";

export type t_get_me_fields = {
	id: string;
	login: string;
	name: string;
	email: string | null;
	skin_id: string;
	elo: number;
	two_fact_auth: boolean;
	channels: t_channels_fields[];
	channels_owned_ids: string[];
	games_played: t_games_played_fields[];
	friends_ids: string[];
	pending_friends_ids: string[];
	blocked_ids: string[];
};

export type t_get_me_fields_tmp = {
	id: string;
	login: string;
	name: string;
	email: string | null;
	skinId: string;
	elo: number;
	twoFactAuth: boolean;
	channels: t_channels_fields_tmp[];
	channelsOwned: t_channels_owned_fields_tmp[];
	gamesPlayed: t_games_played_fields_tmp[];
	friends: t_related_user_fields_tmp[];
	pendingFriendRequests: t_related_user_fields_tmp[];
	blocked: t_related_user_fields_tmp[];
};

export type t_channels_fields = {
	id: string;
	name: string;
	type: ChanType;
};

export type t_games_played_fields = {
	id: string;
	players_ids: [string, string];
	scores: [number, number];
	date_time: Date;
	winner_id: string;
};

export type t_channels_fields_tmp = {
	id: string;
	name: string;
	chanType: ChanType;
};

type t_channels_owned_fields_tmp = {
	id: string;
};

type t_games_played_fields_tmp = {
	id: string;
	players: {
		id: string;
	}[];
	scores: number[];
	dateTime: Date;
	winnerId: string;
};

type t_related_user_fields_tmp = {
	id: string;
};
