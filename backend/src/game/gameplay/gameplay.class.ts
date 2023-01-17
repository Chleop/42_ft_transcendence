import { Score } from "../aliases";
import { PaddleDto } from "../dto";
import { Ball, ResultsObject, Paddle, ScoreUpdate } from "../objects";

import * as Constants from "../constants/constants";

/* Track the state of the game, calculates the accuracy of the incomming data */
export class Gameplay {
	private scores: Score;
	private paddle1: Paddle;
	private paddle2: Paddle;
	private ball: Ball;
	private last_update: number;

	constructor() {
		this.scores = {
			player1_score: 0,
			player2_score: 0,
		};
		this.paddle1 = new Paddle();
		this.paddle2 = new Paddle();
		this.ball = new Ball();
		this.last_update = -1;
	}

	/* == PUBLIC ================================================================================ */

	/* -- UPDATING GAME ------------------------------------------------------- */
	/* Generate random initial ball velocity vector */
	public initializeGame(): Ball {
		console.log("Initializing:");
		console.log(this.ball);
		this.last_update = Date.now();
		return this.ball;
	}

	/* Generates a ball update */
	public refresh(): Ball | ScoreUpdate /* GameUpdate */ {
		const now: number = Date.now();
		const delta_time = (now - this.last_update) * 0.001;
		this.last_update = now;

		const ret: number = this.ball.refresh(delta_time);

		switch (ret) {
			case Constants.BallRefreshResult.nothing:
				break;
			case Constants.BallRefreshResult.oneCollide:
				this.ball.checkPaddleCollision(this.paddle1.position);
				break;
			case Constants.BallRefreshResult.twoCollide:
				this.ball.checkPaddleCollision(this.paddle2.position);
				break;
			case Constants.BallRefreshResult.oneOutside:
				if (this.ball.isOutside()) return this.oneWon();
				break;
			case Constants.BallRefreshResult.twoOutside:
				if (this.ball.isOutside()) return this.twoWon();
				break;
		}
		return this.ball;
	}

	// TODO: Cleanup this function...
	public checkUpdate(
		who: number | null,
		dto: PaddleDto,
	): {
		has_cheated: boolean;
		updated_paddle: PaddleDto;
	} {
		let updated_paddle: PaddleDto;
		if (who === 1) {
			updated_paddle = this.paddle1.update(dto, Date.now());
		} else if (who === 2) {
			updated_paddle = this.paddle2.update(dto, Date.now());
		} else {
			throw null;
		}
		// Return corrected paddle if anticheat stroke
		return {
			has_cheated: false,
			updated_paddle: updated_paddle,
		};
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getScores(): Score {
		return this.scores;
	}

	public getResults(guilty: number): ResultsObject {
		return new ResultsObject(this.scores, guilty);
	}

	/* == PRIVATE =============================================================================== */

	/* -- GAME STATUS UPDATE -------------------------------------------------- */
	/* Players 1 marked a point, send results OR reinitialize */
	private oneWon(): ScoreUpdate {
		++this.scores.player1_score;
		if (this.scores.player1_score === Constants.max_score) {
			throw new ResultsObject(
				this.scores,
				// new PlayerData(this.scores.player1_score),
				// new PlayerData(this.scores.player2_score),
			);
		}
		this.ball = new Ball();
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, true);
	}

	/* Players 2 marked a point, send results OR reinitialize */
	private twoWon(): ScoreUpdate {
		++this.scores.player2_score;
		if (this.scores.player2_score === Constants.max_score) {
			throw new ResultsObject(
				this.scores,
				// new PlayerData(this.scores.player1_score),
				// new PlayerData(this.scores.player2_score),
			);
		}
		this.ball = new Ball();
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, false);
	}
}
