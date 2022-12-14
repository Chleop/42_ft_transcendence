import {
	Score,
	Ball,
	GameUpdate,
	Client
} from '../aliases';
import { PaddleDto } from '../dto';


// PLACEHOLDERS =================
const ping: number = 20;
/* Height and width, divided by 2 */
const w_2: number = 8;
const h_2: number = 4.5;
/* Shift paddle from wall */
const paddle_x: number = 1;
const max_paddle: number = w_2 - paddle_x; // = 8 - 1 = 7
/* Ball radius */
const radius: number = 0.2;
const max_score: number = 3;
// END PLACEHOLDERS =============


/*
	TODO:
 	- find way to link with service
*/

/* Track the state of the game, calculates the accuracy of the incomming data */
export class Gameplay {
	private scores: Score;
	private ball: Ball;
	private paddle1: PaddleDto = new PaddleDto();
	private paddle2: PaddleDto = new PaddleDto();
	private last_update: number = null;

	constructor() {
		this.scores.player1_score = 0;
		this.scores.player2_score = 0;
		this.ball = null;
	}

	/* == PUBLIC ================================================================================== */

	/* -- UPDATING GAME ------------------------- */
	/* Generate random initial ball velocity vector */
	public initializeGame(): GameUpdate {
		if (this.ball !== null)
			throw 'Ball already initialized';
		const x: number = Math.random();
		const y: number = Math.random();
		const v_norm: number = Math.sqrt(x * x + y * y);
		this.ball = {
			x: x,
			y: y,
			vx: x / v_norm,
			vy: y / v_norm,
		};
		return this.generateUpdate();
	}

	public refresh(): GameUpdate {
		this.refreshBall();
		return this.generateUpdate();
	}

	/* -- UTILITARIES --------------------------- */
	public getScores(): Score {
		return this.scores;
	}

	/* == PRIVATE ================================================================================= */

	/* -- GAME STATUS UPDATE -------------------- */
	/* Generate GameUpdate */
	private generateUpdate(): GameUpdate {
		return {
			updated_ball: this.ball,
			scores: this.scores
		};
	}

	/* Send refreshed ball value */
	private refreshBall(): void {
		console.info(this.ball);
		this.refreshX();
		this.refreshY();
	}

	/* Refresh on X axis */
	private refreshX(): void {
		const new_x: number = this.ball.vx * ping;
		if (new_x > max_paddle) { // player2 lost
			return this.oneWon();
		} else if (new_x < -max_paddle) { // player1 lost
			return this.twoWon();
		}
		this.ball.x = new_x; // Ball keeps going
		this.ball.vx = -this.ball.vx; // Invert direction 
		this.increaseSpeed();
	}

	/* Refresh on Y axis */
	private refreshY(): void {
		const new_y: number = this.ball.x * ping;
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

	private oneWon(): void {
		this.scores.player1_score++;
		if (this.scores.player1_score === max_score)
			throw this.generateUpdate();
			//throw this.scores;
	}

	private twoWon(): void {
		this.scores.player2_score++;
		if (this.scores.player2_score === max_score)
			throw this.generateUpdate();
			//throw this.scores;
	}

	private increaseSpeed() {
		this.ball.vx *= 1.005;
	}

}
