import { Socket } from "socket.io";

export type Match = {
	name: string;
	player1: Socket;
	player2: Socket;
};
