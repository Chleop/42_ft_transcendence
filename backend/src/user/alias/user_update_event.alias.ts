export type t_user_update_event = {
	id: string;
	name?: string;
	status?: "in-game" | "spectating" | "online" | "offline";
	spectating?: string;
	game_won?: number;
	game_lost?: number;
	is_avatar_changed?: boolean;
};
