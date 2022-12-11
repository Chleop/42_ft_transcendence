import { Ball, UpdatedPlayer } from './';

export type GameUpdate = {
	// New ball infos
	updated_ball: Ball,

	player1: UpdatedPlayer,
	player2: UpdatedPlayer
}
