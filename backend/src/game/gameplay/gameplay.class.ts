import { Score } from "../aliases";
import { PaddleDto } from "../dto";
import { Ball, PlayerData, ResultsObject, GameUpdate } from "../objects";

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
		this.last_update = Date.now();
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
	public initializeGame(): GameUpdate {
		// this.ball = new Ball();
		console.info("Initializing:");
		console.info(this.ball);
		this.last_update = Date.now();
		return new GameUpdate(this.ball, this.scores);
	}

	/* Generates a ball update */
	public refresh(): GameUpdate {
		const now: number = Date.now();
		const delta_time = (now - this.last_update) * 0.001;
		this.last_update = now;

		const ret: number = this.ball.refresh(delta_time);
		if (ret === 1) {
			// Ball is far right
			if (!this.ball.checkPaddleCollision(this.paddle1.position, ret)) {
				this.oneWon();
			}
		} else if (ret === -1) {
			// Ball is far left
			if (!this.ball.checkPaddleCollision(this.paddle2.position, ret)) {
				this.twoWon();
			}
		}
		return new GameUpdate(this.ball, this.scores);
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
	private oneWon(): void {
		++this.scores.player1_score;
		if (this.scores.player1_score === Constants.max_score) {
			throw new ResultsObject(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false),
			);
		}
		this.ball = new Ball();
	}

	/* Players 2 marked a point, send results OR reinitialize */
	private twoWon(): void {
		++this.scores.player2_score;
		if (this.scores.player2_score === Constants.max_score) {
			throw new ResultsObject(
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true),
			);
		}
		this.ball = new Ball();
	}
}
