import { Ball, Paddle } from ".";

/**
 * Object send to spectator rooms (contains game scene data)
 */
export class SpectatorUpdate {
	public readonly ball: Ball;
	public readonly player1: Paddle;
	public readonly player2: Paddle;

	/* CONSTRUCTOR ============================================================= */

	constructor(ball: Ball, player1: Paddle, player2: Paddle) {
		this.ball = ball;
		this.player1 = player1;
		this.player2 = player2;
	}
}
