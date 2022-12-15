import {
	Score,
	Ball,
	GameUpdate,
	Client
} from '../aliases';
import { PaddleDto } from '../dto';
import { PlayerData, ResultsObject } from '../results';

// PLACEHOLDERS =================
const ping: number = 20;
const speed_factor: number = 1.005;

/* Height and width, divided by 2 */
const w_2: number = 8;
const h_2: number = 4.5;

/* Half of paddle size */
const paddle_radius: number = 1;

/* Shift paddle from wall */
const paddle_x: number = 1;
const max_paddle: number = w_2 - paddle_x; // = 8 - 1 = 7

/* Ball radius */
const radius: number = 0.2;
const max_score: number = 3;

const limit_x: number = max_paddle - radius; // 7 - 0.2 = 6.8

// END PLACEHOLDERS =============


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
		this.scores.player1_score = 0;
		this.scores.player2_score = 0;
		this.paddle1 = new PaddleDto();
		this.paddle2 = new PaddleDto();
	}

	/* == PUBLIC ================================================================================== */

	/* -- RESULTS ------------------------------------------------------------- */
	public getResults(): ResultsObject {
		return new ResultsObject(
			new PlayerData(this.scores.player1_score, false),
			new PlayerData(this.scores.player2_score, false)
		);
	}

	/* -- UPDATING GAME ------------------------------------------------------- */
	/* Generate random initial ball velocity vector */
	public initializeGame(): GameUpdate {
		this.initializeBall();
		return this.generateUpdate();
	}

	public refresh(): GameUpdate {
		this.refreshBall();
		return this.generateUpdate();
	}

	public checkUpdate(who: number, dto: PaddleDto): PaddleDto {
		if (who === 1) {
			//this.verifyAccuracyPaddle(dto, this.paddle1);
			this.paddle1 = dto;
		} else {
			//this.verifyAccuracyPaddle(dto, this.paddle1);
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

	private checkPaddleCollision(paddle: PaddleDto): boolean {
		if (this.ball.y < paddle.position + paddle_radius
				&& this.ball.y > paddle.position - paddle_radius) {
			// ball hit paddle
			this.ball.vx = -this.ball.vx; // Invert direction 
			this.increaseSpeed();
			// TODO: shift ball.vy a little depending on position of ball on paddle
			return true;
		}
		return false;
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

	private endOfGame(player1: PlayerData, player2: PlayerData): ResultsObject {
		return new ResultsObject(player1, player2);
	}

	private oneWon(): void {
		this.scores.player1_score++;
		if (this.scores.player1_score === max_score) {
			throw this.endOfGame(
				new PlayerData(this.scores.player1_score, true),
				new PlayerData(this.scores.player2_score, false)
			);
		}
		this.initializeBall();
	}

	private twoWon(): void {
		this.scores.player2_score++;
		if (this.scores.player2_score === max_score) {
			throw this.endOfGame(
				new PlayerData(this.scores.player1_score, false),
				new PlayerData(this.scores.player2_score, true)
			);
		}
		this.initializeBall();
	}

	/* -- BALL UPDATE --------------------------------------------------------- */
	private initializeBall(): void {
		const x: number = Math.random(); //TODO: get limit angle
		const y: number = Math.random();
		const v_norm: number = Math.sqrt(x * x + y * y);
		this.ball = {
			x: x,
			y: y,
			vx: x / v_norm,
			vy: y / v_norm
		};
	}

	/* Send refreshed ball value */
	private refreshBall(): void {
		console.info(this.ball);
		this.refreshY();
		this.refreshX();
	}

	/* Refresh on X axis */
	private refreshX(): void {
		this.ball.x = this.ball.vx * ping;
		if (this.ball.x > limit_x) {
			if (!this.checkPaddleCollision(this.paddle1))
				return this.twoWon();
		} else if (this.ball.x < -limit_x) {
			if (!this.checkPaddleCollision(this.paddle2))
				return this.oneWon();
		}
	}

	/* Refresh on Y axis */
	private refreshY(): void {
		const new_y: number = this.ball.vy * ping;
		if (new_y > h_2) {
			this.ball.y = h_2;
		} else if (new_y < -h_2) {
			this.ball.y = -h_2;
		} else {
			this.ball.y = new_y;
			return;
		}
		this.ball.vy = -this.ball.vy;
	}

	private increaseSpeed(): void {
		this.ball.vx *= speed_factor;
		this.ball.vy *= speed_factor;
	}

}
