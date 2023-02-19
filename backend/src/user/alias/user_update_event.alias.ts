import { e_user_status } from "src/user/enum";

export type t_user_update_event = {
	id: string;
	name?: string;
	status?: e_user_status;
	spectating?: string;
	game_won?: number;
	game_lost?: number;
	is_avatar_changed?: boolean;
};
