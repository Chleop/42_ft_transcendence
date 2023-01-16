import * as Constants from "../constants/constants";

export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;

	constructor(coords?: { x: number; y: number; vx: number; vy: number }) {
		if (coords === undefined) {
			const angle: number = this.generateSign() * Math.random() * Math.PI * 0.25;
			this.x = 0;
			this.y = 0;
			this.vx = this.generateSign() * Math.cos(angle) * Constants.initial_speed;
			this.vy = this.generateSign() * Math.sin(angle) * Constants.initial_speed;
		} else {
			this.x = coords.x;
			this.y = coords.y;
			this.vx = coords.vx;
			this.vy = coords.vy;
		}
	}

	/* == PUBLIC ================================================================================ */

	/* Send refreshed ball value */
	public refresh(delta_time: number): number {
		this.refreshX(delta_time);
		this.refreshY(delta_time);

		if (this.x >= Constants.max_x) return Constants.BallRefreshResult.twoOutside;
		else if (this.x >= Constants.limit_x) return Constants.BallRefreshResult.twoCollide;
		else if (this.x <= -Constants.max_x) return Constants.BallRefreshResult.oneOutside;
		else if (this.x <= -Constants.limit_x) return Constants.BallRefreshResult.oneCollide;
		return Constants.BallRefreshResult.nothing;
	}

	/* Check if ball hits paddle */
	public checkPaddleCollision(paddle_y: number): boolean {
		if (
			this.y < paddle_y + Constants.paddle_radius &&
			this.y > paddle_y - Constants.paddle_radius
		) {
			this.shiftBouncing(paddle_y);
			this.increaseSpeed();
			return true;
		}
		return false;
	}

	public invert(): Ball {
		return new Ball({ x: -this.x, y: this.y, vx: -this.vx, vy: this.vy });
	}

	public isOutside(): boolean {
		return this.x < -Constants.w_2 || this.x > Constants.w_2;
	}

	/* == PRIVATE =============================================================================== */

	/* Refresh on X axis */
	private refreshX(delta_time: number): void {
		this.x += this.vx * delta_time;
	}

	/* Refresh on Y axis */
	private refreshY(delta_time: number): void {
		const new_y: number = this.y + this.vy * delta_time;
		if (new_y > Constants.limit_y) {
			this.y = Constants.limit_y;
		} else if (new_y < -Constants.limit_y) {
			this.y = -Constants.limit_y;
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
		const vx: number = -this.vx / orig_norm;

		const norm: number = Math.sqrt(vx * vx + vy * vy);
		this.vy = (vy / norm) * orig_norm;
		this.vx = (vx / norm) * orig_norm;
	}

	private generateSign(): number {
		return Math.random() < 5 ? 1 : -1;
	}
}
