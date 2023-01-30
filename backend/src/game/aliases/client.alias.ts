import { Socket } from "socket.io";

type Id = {
	user_id: string;
};

export type Client = Socket & Id;
/* export type Client = {
	// Client associated socket
	socket: Socket;

	// Jwt token stored
	id: string;
};
 */
