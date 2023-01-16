import { Score } from "../aliases";
import { Ball } from "../objects";

// Update for spectators
export class GameUpdate {
	// New ball infos
	private readonly updated_ball: Ball;

	// Scores of the ongoing game
	private readonly scores: Score;

	constructor(ball: Ball, score: Score) {
		this.updated_ball = ball;
		this.scores = score;
	}

	public invert(): GameUpdate {
		return new GameUpdate(this.updated_ball.invert(), this.scores);
	}
}
