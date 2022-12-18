const Constants = require('../constants/constants');

export class Ball {
	private x: number;
	private y: number;
	private vx: number;
	private vy: number;
	private velocity: number;

	constructor() {
		const vx: number = Math.random(); //TODO: get limit angle
		const vy: number = Math.random();
		const v_norm: number = Math.sqrt((vx * vx) + (vy * vy));
		this.x = 0;
		this.y = 0;
		this.vx = vx / v_norm;
		this.vy = vy / v_norm;
		this.velocity = Constants.initial_speed;
	}

	/* Send refreshed ball value */
	public refresh(): number {
		//console.info(this);
		console.info('Old x:', this.x);
		console.info('Old y:', this.y);
		this.refreshX();
		this.refreshY();
		console.info('New x:', this.x);
		console.info('New y:', this.y);
		if (this.x > Constants.limit_x)
			return 1;
		else if (this.x < - Constants.limit_x)
			return -1;
		return 0;
	}

	/* Check if ball hits paddle */
	public checkPaddleCollision(paddle_y: number): boolean {
		if (this.y < paddle_y + Constants.paddle_radius
				&& this.y > paddle_y - Constants.paddle_radius) {
			this.shiftBouncing(paddle_y);
			this.increaseSpeed();
			return true;
		}
		return false;
	}

	/* == PRIVATE ================================================================================= */

	/* Refresh on X axis */
	private refreshX(): void {
		this.x = this.vx * this.velocity * Constants.ping * .001;
	}

	/* Refresh on Y axis */
	private refreshY(): void {
		const new_y: number = this.vy * this.velocity * Constants.ping * .001;
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
		const vy: number = this.vy + (.5 * oh);
		const norm: number = Math.sqrt((this.vx * this.vx) + (vy * vy));
		this.vy = vy / norm;
		this.vx = - this.vx / norm;
	}

};
