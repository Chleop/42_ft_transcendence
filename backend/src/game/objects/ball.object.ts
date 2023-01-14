import * as Constants from "../constants/constants";

export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;

	constructor() {
		const angle: number = this.generateSign() * (Math.random() * Math.PI * 0.25);
		// const angle: number = Math.random() * Math.PI * 2;
		this.x = 0;
		this.y = 0;
		this.vx = this.generateSign() * Math.cos(angle) * Constants.initial_speed;
		this.vy = this.generateSign() * Math.sin(angle) * Constants.initial_speed;
	}

	/* == PUBLIC ================================================================================ */

	/* Send refreshed ball value */
	public refresh(delta_time: number): number {
		this.refreshX(delta_time);
		this.refreshY(delta_time);
		if (this.x > Constants.limit_x) return 1;
		else if (this.x < -Constants.limit_x) return -1;
		return 0;
	}

	/* Check if ball hits paddle */
	public checkPaddleCollision(paddle_y: number, left: number): boolean {
		if (
			this.y < paddle_y + Constants.paddle_radius &&
			this.y > paddle_y - Constants.paddle_radius
		) {
			// Ball collides on paddle
			this.x = left * Constants.max_paddle;
			this.shiftBouncing(paddle_y);
			this.increaseSpeed();
			return true;
		}
		return false;
	}

	/* == PRIVATE =============================================================================== */

	/* Refresh on X axis */
	private refreshX(delta_time: number): void {
		this.x += this.vx * delta_time;
	}

	/* Refresh on Y axis */
	private refreshY(delta_time: number): void {
		const new_y: number = this.y + this.vy * delta_time;
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
		this.vx *= Constants.acceleration;
		this.vy *= Constants.acceleration;
	}

	/* Shift ball.vy a little depending on position of ball on paddle */
	private shiftBouncing(paddle_y: number): void {
		const orig_norm: number = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
		const oh: number = this.y - paddle_y;
		const vy: number = this.vy / orig_norm + 0.5 * oh;
		const vx: number = this.vx / orig_norm;
		const norm: number = Math.sqrt(vx * vx + vy * vy);
		this.vy = (vy / norm) * orig_norm;
		this.vx = -(vx / norm) * orig_norm;
	}

	private generateSign(): number {
		return Math.random() < 5 ? 1 : -1;
	}
}
