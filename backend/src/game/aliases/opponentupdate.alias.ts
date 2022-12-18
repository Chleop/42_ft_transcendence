import { Socket } from 'socket.io';
import { PaddleDto } from '../dto';

export type OpponentUpdate = {
	// Opponent socket
	player: Socket,

	// Paddle of the client
	updated_paddle: PaddleDto
};

