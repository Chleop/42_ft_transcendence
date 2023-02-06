import { Socket } from "socket.io";

/**
 * Storing match name and the two players socket instance.
 */
export type Match = {
	name: string;
	player1: Socket;
	player2: Socket;
};
