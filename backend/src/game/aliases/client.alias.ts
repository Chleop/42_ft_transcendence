import { Socket } from "socket.io";

export type Client = {
	// Socket associated socket
	socket: Socket;

	// Jwt token stored
	id: string;
};
