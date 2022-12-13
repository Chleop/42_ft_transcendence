import { Score, Ball, GameUpdate, Client } from '../aliases';


// PLACEHOLDERS

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


/*
	TODO:
 	- find way to link with service
*/

/* Game engine */
export class Gameplay {
	private results: Score = {
		player1_score: 0,
		player2_score: 0,
		winner: null
	}

	constructor() {}

	/* == PUBLIC ================================================================================== */

	public getScores(): Score {
		return this.results;
	}

//	/* Generate random initial direction for ball */
//	public startGame(): void {//GameUpdate {
//		this.initializeGame();//player1, player2));
//		//send ball;
//	}
//
//	public initializeGame(/* player1: Client, player2: Client*/): void {
//		//this.player1 = player1;
//		//this.player2 = player2;
//		const x: number = Math.random();
//		const y: number = Math.random();
//		const v_norm: number = Math.sqrt(x * x + y * y);
//		this.ball = {
//			x: x,
//			y: y,
//			vx: x / v_norm,
//			vy: y / v_norm,
//		};
//		//setinterval?
//	}
//
//	/* Called every 20ms */
//	public update(player1: Client, player2: Client): void {//GameUpdate {
//	}
//
//	/* == PRIVATE ================================================================================= */
//
//	private /* async */ refreshBall(): Ball {
//		// Add to DB ??
//		// Send back as refreshed version
//		console.info(this.ball);
//		this.refreshX();
//		this.refreshY();
//		return this.ball;
//	}
//
//	/* Refresh on X axis */
//	private refreshX(): void {
//		const new_x: number = this.ball.vx * ping;
//		if (new_x > max_paddle) { // player2 lost
//			throw this.oneWon();
//		} else if (new_x < -max_paddle) { // player1 lost
//			throw this.twoWon();
//		}
//		this.ball.x = new_x; // Ball keeps going
//		this.ball.vx = -this.ball.vx; // Invert direction 
//		this.increaseSpeed();
//	}
//
//	/* Refresh on Y axis */
//	private refreshY(): void {
//		const new_y: number = this.ball.x * ping;
//		if (new_y > h_2) {
//			this.ball.y = h_2;
//		} else if (new_y < -h_2) {
//			this.ball.y = -h_2;
//		} else {
//			this.ball.y = new_y;
//			return;
//		}
//		this.ball.vy = -this.ball.vy;
//	}
//
//	private oneWon(): Score {
//		this.results.player1_score++;
//		if (this.results.player1_score === max_score)
//			this.results.ongoing = false;
//		return (this.results);
//	}
//
//	private twoWon(): Score {
//		this.results.player2_score++;
//		if (this.results.player2_score === max_score)
//			this.results.ongoing = false;
//		return (this.results);
//	}
//
//	private increaseSpeed() {
//		this.ball.vx *= 1.005;
//	}

}
