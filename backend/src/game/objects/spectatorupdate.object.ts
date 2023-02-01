import { Ball, Paddle } from ".";

/**
 * Object send to spectator rooms (contains full game data)
 * -> TODO: Replace by gameplay ? Just smaller object
 */
export class SpectatorUpdate {
	public readonly ball: Ball;
	public readonly player1: Paddle;
	public readonly player2: Paddle;

	constructor(ball: Ball, player1: Paddle, player2: Paddle) {
		this.ball = ball;
		this.player1 = player1;
		this.player2 = player2;
	}
}
