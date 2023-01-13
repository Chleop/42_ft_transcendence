// import { Constant } from "../constants/constants";

const Constants = require("../constants/constants");

export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private velocity: number;

	constructor() {
		const vx: number = Math.random(); //TODO: get limit angle
		const vy: number = Math.random();
		const v_norm: number = Math.sqrt(vx * vx + vy * vy);
		this.x = 0;
		this.y = 0;
		this.vx = vx / v_norm;
		this.vy = vy / v_norm;
		this.velocity = Constants.initial_speed;
	}

	/* == PUBLIC ================================================================================ */

	/* Send refreshed ball value */
	public refresh(): number {
		//console.info(this);
		this.refreshX();
		this.refreshY();
		if (this.x > Constants.limit_x) return 1;
		else if (this.x < -Constants.limit_x) return -1;
		return 0;
	}

	/* Check if ball hits paddle */
	public checkPaddleCollision(paddle_y: number): boolean {
		if (
			this.y < paddle_y + Constants.paddle_radius &&
			this.y > paddle_y - Constants.paddle_radius
		) {
			this.x = Constants.paddle_x;
			this.shiftBouncing(paddle_y);
			this.increaseSpeed();
			return true;
		}
		return false;
	}

	/* == PRIVATE =============================================================================== */

	/* Refresh on X axis */
	private refreshX(): void {
		this.x += this.vx * this.velocity * Constants.ping * 0.001;
	}

	/* Refresh on Y axis */
	private refreshY(): void {
		const new_y: number = this.y + this.vy * this.velocity * Constants.ping * 0.001;
		if (new_y > Constants.h_2) {
			this.y = Constants.h_2;
		} else if (new_y < -Constants.h_2) {
			this.y = -Constants.h_2;
		} else {
			this.y = new_y;
			return;
		}
		this.vy = -this.vy;
	}

	private increaseSpeed(): void {
		this.velocity *= Constants.acceleration;
	}

	/* Shift ball.vy a little depending on position of ball on paddle */
	private shiftBouncing(paddle_y: number): void {
		const oh: number = this.y - paddle_y; // OH vector
		const vy: number = this.vy + 0.5 * oh;
		const norm: number = Math.sqrt(this.vx * this.vx + vy * vy);
		this.vy = vy / norm;
		this.vx = -this.vx / norm;
	}
}
