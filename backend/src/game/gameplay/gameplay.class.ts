import { Score } from "../aliases";
import { PaddleDto } from "../dto";
import { Ball, PlayerData, ResultsObject /* GameUpdate */, ScoreUpdate } from "../objects";

import * as Constants from "../constants/constants";

/* Track the state of the game, calculates the accuracy of the incomming data */
export class Gameplay {
	private scores: Score;
	private paddle1: PaddleDto;
	private paddle2: PaddleDto;
	private ball: Ball;
	private last_update: number;

	constructor() {
		this.scores = {
			player1_score: 0,
			player2_score: 0,
		};
		this.paddle1 = new PaddleDto();
		this.paddle2 = new PaddleDto();
		this.ball = new Ball();
		this.last_update = -1;
	}

	/* == PUBLIC ================================================================================ */

	/* -- RESULTS ------------------------------------------------------------- */
	public getResults(guilty: number): ResultsObject {
		if (guilty === 2) {
			return new ResultsObject(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false),
			);
		} else {
			return new ResultsObject(
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true),
			);
		}
	}

	/* -- UPDATING GAME ------------------------------------------------------- */
	/* Generate random initial ball velocity vector */
	public initializeGame(): Ball /* GameUpdate */ {
		console.log("Initializing:");
		console.log(this.ball);
		this.last_update = Date.now();
		return this.ball;
		// return new GameUpdate(this.ball, this.scores);
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
		// return new GameUpdate(this.ball, this.scores);
	}

	// TODO: Cleanup this function...
	public checkUpdate(
		who: number | null,
		dto: PaddleDto,
	): {
		has_cheated: boolean;
		updated_paddle: PaddleDto;
	} | null {
		if (who === 1) {
			const checked_value: PaddleDto = this.verifyAccuracyPaddle(dto, this.paddle1);
			this.paddle1 = checked_value;
		} else if (who === 2) {
			const checked_value: PaddleDto = this.verifyAccuracyPaddle(dto, this.paddle2);
			this.paddle2 = checked_value;
		} else {
			return null;
		}
		// Return corrected paddle if anticheat stroke
		return {
			has_cheated: false,
			updated_paddle: dto,
		};
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getScores(): Score {
		// TODO: useless??
		return this.scores;
	}

	/* == PRIVATE =============================================================================== */

	/* -- PADDLE LOOK AT ------------------------------------------------------ */
	/* Check if received paddle seems accurate */
	private verifyAccuracyPaddle(dto: PaddleDto, paddle_checked: PaddleDto): PaddleDto {
		//TODO anticheat
		this.last_update;
		paddle_checked;
		return dto;
	}

	/* -- GAME STATUS UPDATE -------------------------------------------------- */

	/* Players 1 marked a point, send results OR reinitialize */
	private oneWon(): ScoreUpdate {
		++this.scores.player1_score;
		if (this.scores.player1_score === Constants.max_score) {
			throw new ResultsObject(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false),
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
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true),
			);
		}
		this.ball = new Ball();
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, false);
	}
}
