import { Socket } from "socket.io";
import { e_user_status } from "src/user/enum";

export type t_user_id = {
	id: string;
};

export type t_user_status = {
	socket: Socket;
	status: e_user_status;
	spectated_user?: string;
};
