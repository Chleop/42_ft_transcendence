import { e_user_status } from "src/user/enum";

export type t_user_update_event = {
	id: string;
	status?: e_user_status;
	spectating?: string;
};
