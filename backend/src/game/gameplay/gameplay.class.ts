import { Score } from "../aliases";
import { PaddleDto } from "../dto";
import { Ball, Paddle, BallRefreshResult } from "./";
import { Results, ScoreUpdate } from "../objects";
import { SpectatorUpdate } from "../../spectator/objects";
import { Constants } from "../constants";

/**
 * Tracks the state of the game.
 */
export class Gameplay {
	private scores: Score;
	private paddle1: Paddle;
	private paddle2: Paddle;
	private ball: Ball;
	private last_update: number;
	private winner: number;

	/* CONSTRUCTOR ============================================================= */

	constructor() {
		this.scores = {
			player1_score: 0,
			player2_score: 0,
		};
		this.paddle1 = new Paddle();
		this.paddle2 = new Paddle();
		this.ball = new Ball();
		this.last_update = -1;
		this.winner = 0;
	}

	/* PUBLIC ================================================================== */

	/**
	 * Generates ball for game initialization.
	 */
	public initializeGame(): Ball {
		this.last_update = Date.now();
		return this.ball;
	}

	/**
	 * Refreshes ball position.
	 *
	 * If ball goes outside of the scene, a ScoreUpdate is generated.
	 * If the end of game is reached, a Results is generated.
	 */
	public refresh(): Ball | ScoreUpdate | Results {
		const now: number = Date.now();
		const delta_time: number = (now - this.last_update) * 0.001;

		this.last_update = now;

		const ret: number = this.ball.refresh(delta_time);

		switch (ret) {
			case BallRefreshResult.nothing:
				break;

			case BallRefreshResult.oneOutside:
				if (this.ball.isOutside()) return this.oneWon();
				break;
			case BallRefreshResult.twoOutside:
				if (this.ball.isOutside()) return this.twoWon();
				break;

			case BallRefreshResult.oneCollide:
				this.ball.checkPaddleCollision(this.paddle1.position);
				break;
			case BallRefreshResult.twoCollide:
				this.ball.checkPaddleCollision(this.paddle2.position);
				break;
		}
		return this.ball;
	}

	/**
	 * Updates paddle in game.
	 *
	 * In case the updated paddle doesn't match the expectations,
	 * the corrected paddle is sent back to sender.
	 */
	public checkUpdate(who: number, dto: PaddleDto): PaddleDto {
		if (who === 1) this.paddle1.update(dto, Date.now());
		else this.paddle2.update(dto, Date.now());
		return dto;
	}

	/* ------------------------------------------------------------------------- */

	public getScores(): Score {
		return this.scores;
	}

	public getScoreUpdate(): ScoreUpdate {
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, true);
	}

	public getSpectatorUpdate(): SpectatorUpdate {
		return new SpectatorUpdate(this.ball, this.paddle1, this.paddle2);
	}

	public getWinner(): number {
		return this.winner;
	}

	/* PRIVATE ================================================================= */

	/**
	 * Called if player1 marked a point.
	 *
	 * Return value depends on whether the point was decisive or not.
	 */
	private oneWon(): ScoreUpdate | Results {
		++this.scores.player1_score;
		if (this.scores.player1_score === Constants.max_score) {
			this.winner = 1;
			return new Results(this.scores);
		}
		this.ball = new Ball();
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, true);
	}

	/**
	 * Called if player2 marked a point.
	 */
	private twoWon(): ScoreUpdate | Results {
		++this.scores.player2_score;
		if (this.scores.player2_score === Constants.max_score) {
			this.winner = 2;
			return new Results(this.scores);
		}
		this.ball = new Ball();
		return new ScoreUpdate(this.scores.player1_score, this.scores.player2_score, false);
	}
}
