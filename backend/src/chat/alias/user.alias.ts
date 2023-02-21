import { e_user_status } from "src/user/enum";

export type t_user_id = {
	id: string;
	login: string;
};

export type t_user_status = {
	nb_socket_in_room: number;
	login: string;
	status: e_user_status;
	spectated_user?: string;
};
