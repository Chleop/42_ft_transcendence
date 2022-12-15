import { Ball, Score } from './';

// Update for spectators
export type GameUpdate = {
	// New ball infos
	updated_ball: Ball,

	// Scores of the ongoing game
	scores: Score
};
