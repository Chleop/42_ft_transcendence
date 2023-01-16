// import { Score } from "../aliases";
// import { Ball } from "../objects";

// Update for spectators
// export class GameUpdate {
// 	// New ball infos
// 	private readonly updated_ball: Ball;

// 	// Scores of the ongoing game
// 	private readonly scores: Score;

// 	constructor(ball: Ball, score: Score) {
// 		this.updated_ball = ball;
// 		this.scores = score;
// 	}

// 	public invert(): GameUpdate {
// 		return new GameUpdate(this.updated_ball.invert(), this.scores);
// 	}
// }

export class ScoreUpdate {
	private readonly opponent: number;
	private readonly you: number;
	private readonly just_scored: string;

	constructor(score_1: number, score_2: number, left: boolean) {
		this.you = score_1;
		this.opponent = score_2;
		if (left) this.just_scored = "you";
		else this.just_scored = "opponent";
		this.just_scored; // stupid line for this stupid tsconfig
	}

	public invert(): ScoreUpdate {
		return new ScoreUpdate(this.opponent, this.you, false);
	}
}
