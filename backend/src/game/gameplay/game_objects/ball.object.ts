import { Constants } from "../../constants";

/**
 * Ball state at each refresh() call:
 *
 * either it collided with a paddle,
 * either it's outside of the 'playable area',
 * else it is not in a specific state.
 */
export enum BallRefreshResult {
	oneCollide,
	twoCollide,
	oneOutside,
	twoOutside,
	nothing,
}

/**
 * Pong ball coordinates.
 */
export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;

	/* CONSTRUCTOR ============================================================= */

	constructor(coords?: { x: number; y: number; vx: number; vy: number }) {
		if (coords === undefined) {
			const angle: number = this.generateSign() * Math.random() * Constants.pi_4;
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

	/* PUBLIC ================================================================== */

	/**
	 * Send refreshed ball coordinates.
	 */
	public refresh(delta_time: number): number {
		this.refreshX(delta_time);
		this.refreshY(delta_time);

		if (this.x > Constants.max_x) return BallRefreshResult.twoOutside;
		else if (this.x > Constants.limit_x) return BallRefreshResult.twoCollide;
		else if (this.x < -Constants.max_x) return BallRefreshResult.oneOutside;
		else if (this.x < -Constants.limit_x) return BallRefreshResult.oneCollide;
		return BallRefreshResult.nothing;
	}

	/**
	 * Check if the ball hits the paddle.
	 */
	public checkPaddleCollision(paddle_y: number): boolean {
		if (
			this.y - Constants.ball_radius < paddle_y + Constants.paddle_radius &&
			this.y + Constants.ball_radius > paddle_y - Constants.paddle_radius
		) {
			this.x = this.x > Constants.limit_x ? Constants.limit_x : -Constants.limit_x;
			this.shiftBouncing(paddle_y);
			this.increaseSpeed();
			return true;
		}
		return false;
	}

	/* ------------------------------------------------------------------------- */

	/**
	 * Sends inverted x values.
	 *
	 * Allows visual adaptation for player2.
	 */
	public invert(): Ball {
		return new Ball({ x: -this.x, y: this.y, vx: -this.vx, vy: this.vy });
	}

	/**
	 * Returns true of the ball is outside of scene.
	 */
	public isOutside(): boolean {
		return this.x < -Constants.w_2 || this.x > Constants.w_2;
	}

	/* PRIVATE ================================================================= */

	/**
	 * Refreshes coordinates on X axis.
	 */
	private refreshX(delta_time: number): void {
		this.x += this.vx * delta_time;
	}

	/**
	 * Refreshes coordinates on Y axis.
	 */
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

	/**
	 * Increases ball velocity vector.
	 */
	private increaseSpeed(): void {
		this.vx *= Constants.acceleration;
		this.vy *= Constants.acceleration;
	}

	/**
	 * Shifts velocity vector depending on the ball position on the paddle.
	 */
	private shiftBouncing(paddle_y: number): void {
		const oh: number = Math.abs(this.y - paddle_y);
		const percent: number = oh / Constants.paddle_radius;
		const new_vy: number = percent * Constants.cos_pi4;

		const norm: number = Math.sqrt(1 + new_vy * new_vy);
		this.vy = new_vy / norm;
		this.vx = -(1 / norm);
		/*
		const orig_norm: number = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

		const vy: number = this.vy / orig_norm + 0.5 * oh;
		const vx: number = -this.vx / orig_norm;

		const norm: number = Math.sqrt(vx * vx + vy * vy);
		this.vy = (vy / norm) * orig_norm;
		this.vx = (vx / norm) * orig_norm;
		*/
	}

	private generateSign(): number {
		return Math.random() < 5 ? 1 : -1;
	}
}
