import { Ball, UpdatedPlayer } from './';

// Update for spectators
export type GameUpdate = {
	// New ball infos
	updated_ball: Ball,

	// Paddle1 position
	player1: UpdatedPlayer,
	// Paddle2 position
	player2: UpdatedPlayer
};
