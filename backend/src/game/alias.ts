import { Socket } from 'socket.io';

export type Player = {
	socket: Socket,
	id: string
};

export type Match = {
	name: string,
	player1: Player,
	player2: Player
};
