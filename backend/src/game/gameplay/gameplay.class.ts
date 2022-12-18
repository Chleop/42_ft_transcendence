import {
	Score,
	GameUpdate,
	Client
} from '../aliases';
import { PaddleDto } from '../dto';
import { Ball, PlayerData, ResultsObject } from '../objects';

const Constants = require('../constants/constants');

/*
	TODO:
 	- find way to link with service
*/

/* Track the state of the game, calculates the accuracy of the incomming data */
export class Gameplay {
	private scores: Score;
	private paddle1: PaddleDto;
	private paddle2: PaddleDto;
	private ball: Ball = null;
	private last_update: number = null;

	constructor() {
		this.scores = {
			player1_score: 0,
			player2_score: 0
		};
		this.paddle1 = new PaddleDto();
		this.paddle2 = new PaddleDto();
	}

	/* == PUBLIC ================================================================================== */

	/* -- RESULTS ------------------------------------------------------------- */
	public getResults(guilty: number): ResultsObject {
		if (guilty === 2) {
			return new ResultsObject(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false)
			);
		} else {
			return new ResultsObject(
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true)
			);
		}
	}

	/* -- UPDATING GAME ------------------------------------------------------- */
	/* Generate random initial ball velocity vector */
	public initializeGame(): GameUpdate {
		this.ball = new Ball();
		console.info('Initializing:');
		console.info(this.ball);
		return this.generateUpdate();
	}

	public refresh(): GameUpdate {
		console.info('Refreshing...');
		const ret: number = this.ball.refresh();
		if (ret === 1) {
			// Ball is far right
			if (!this.ball.checkPaddleCollision(this.paddle1.position)) {
				this.oneWon();
			}
		} else if (ret === -1) {
			// Ball is far left
			if (!this.ball.checkPaddleCollision(this.paddle2.position)) {
				this.twoWon();
			}
		}
		return this.generateUpdate();
	}

	public checkUpdate(who: number, dto: PaddleDto): PaddleDto { // AntiCheat
		if (who === 1) {
			this.verifyAccuracyPaddle(dto, this.paddle1);
			this.paddle1 = dto;
		} else {
			this.verifyAccuracyPaddle(dto, this.paddle1);
			this.paddle2 = dto;
		}
		return (dto);
	}

	/* -- UTILS --------------------------------------------------------------- */
	public getScores(): Score {
		return this.scores;
	}


	/* == PRIVATE ================================================================================= */

	/* -- PADDLE LOOK AT ------------------------------------------------------ */
	private verifyAccuracyPaddle(dto: PaddleDto, paddle_checked: PaddleDto): void {
		//TODO anticheat
		//throw anticheat;
	}

	/* -- GAME STATUS UPDATE -------------------------------------------------- */
	/* Generate GameUpdate */
	private generateUpdate(): GameUpdate {
		this.last_update = Date.now();
		return {
			updated_ball: this.ball,
			scores: this.scores
		};
	}

	private oneWon(): void {
		this.scores.player1_score++;
		if (this.scores.player1_score === Constants.max_score) {
			throw new ResultsObject(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false)
			);
		}
		// Someone lost: Reinitialize ball
		this.ball = new Ball();
	}

	private twoWon(): void {
		this.scores.player2_score++;
		if (this.scores.player2_score === Constants.max_score) {
			throw new ResultsObject(
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true)
			);
		}
		// Someone lost: Reinitialize ball
		this.ball = new Ball();
	}

}
