import { Constants } from "../../constants";

/**
 * Ball state at each refresh() call:
 *
 * either it collided with a paddle,
 * either it's outside of the 'playable area',
 * else it is not in a specific state.
 */
export enum BallRefreshResult {
	ONE_COLLIDES,
	TWO_COLLIDES,
	ONE_IS_OUTSIDE,
	TWO_IS_OUTSIDE,
	NOTHING,
}

/**
 * Pong ball coordinates.
 */
export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private readonly gravity: boolean;

	/* CONSTRUCTOR ============================================================= */

	constructor(gravity: boolean, coords?: { x: number; y: number; vx: number; vy: number }) {
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
		this.gravity = gravity;
	}

	/* PUBLIC ================================================================== */

	/**
	 * Send refreshed ball coordinates.
	 */
	public refresh(delta_time: number): number {
		this.refreshX(delta_time);
		this.refreshY(delta_time);

		if (this.x > Constants.max_x) return BallRefreshResult.TWO_IS_OUTSIDE;
		else if (this.x > Constants.limit_x) return BallRefreshResult.TWO_COLLIDES;
		else if (this.x < -Constants.max_x) return BallRefreshResult.ONE_IS_OUTSIDE;
		else if (this.x < -Constants.limit_x) return BallRefreshResult.ONE_COLLIDES;
		return BallRefreshResult.NOTHING;
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
		return new Ball(this.gravity, { x: -this.x, y: this.y, vx: -this.vx, vy: this.vy });
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
		if (this.gravity) this.vy -= Constants.gravity;
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
		// Compute the distance of the ball relative to the center of the paddle. The distance is
		// normalize (-1 indicates bottom of the paddle, 1 is top of the paddle).
		const rel_y = (this.y - paddle_y) / Constants.paddle_radius;

		// The speed of the ball must be preserved.
		const was_going_left = this.vx <= 0.0;
		const velocity = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

		// When the ball is on top of the paddle (rel_y == 1), then it must go to that angle.
		const MAX_ANGLE = Constants.pi_3;

		// Linearly interpolate between MAX_ANGLE and -MAX_ANGLE using the relative velociy as a
		// base.
		const angle = MAX_ANGLE * rel_y;

		const out_vel_x = Math.cos(angle) * velocity;
		const out_vel_y = Math.sin(angle) * velocity;

		// Apply the final velocity.
		this.vx = out_vel_x * (was_going_left ? 1 : -1);
		this.vy = out_vel_y;
	}

	private generateSign(): number {
		return Math.random() < 0.5 ? 1 : -1;
	}
}
