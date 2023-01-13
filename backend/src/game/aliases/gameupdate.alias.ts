import { Score } from "./";
import { Ball } from "../objects";

// Update for spectators
export type GameUpdate = {
	// New ball infos
	updated_ball: Ball | null;

	// Scores of the ongoing game
	scores: Score;
};
