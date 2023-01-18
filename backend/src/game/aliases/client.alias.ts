import { Socket } from "socket.io";

export type Client = {
	// Client associated socket
	socket: Socket;

	// Jwt token stored
	id: string;
};
