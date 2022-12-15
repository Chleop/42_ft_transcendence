import { Socket } from 'socket.io';
import { PaddleDto } from '../dto';

export type OpponentUpdate = {
	player: Socket,
	updated_paddle: PaddleDto
};

