import { PaddleDto } from '../dto';

export type AntiCheat = {

	// p1: can be null if no cheat
	p1: PaddleDto | null,

	// p2: to send back to p2
	p2: PaddleDto
};
