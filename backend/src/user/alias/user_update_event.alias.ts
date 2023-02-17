export enum e_user_status {
	ONLINE = "online",
	OFFLINE = "offline",
	INGAME = "ingame",
	SPECTATING = "spectating",
}

export type t_user_update_event = {
	id: string;
	name?: string;
	status?: e_user_status;
	spectating?: string;
	game_won?: number;
	game_lost?: number;
	is_avatar_changed?: boolean;
};
