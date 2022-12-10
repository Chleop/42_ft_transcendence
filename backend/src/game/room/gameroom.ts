import { BallDto } from '../dto';

//export namespace GameRoom {}

/* Defines client infos */
export type Player = {
	id: string,
	socket_id: string
};

export class GameRoom {
	public name: string;
	public user1: Player;
	public user2: Player;

	constructor(name?: string, host?: Player) {
		this.name = name;
		this.user1 = host;
		console.log(`Room '${this.name}' created`);
	}

	/* == PUBLIC ================================================================================== */

	public addGuest(player: Player): void {
		if (this.user2 !== undefined)
			return;
		this.user2 = player;
		console.info("Adding guest ", player.id);
		this.startGame();
	}

	public removeUser(id: string): boolean {
		if (this.user1.socket_id === id)
			this.user1 = undefined;
		else if (this.user2.socket_id === id)
			this.user2 = undefined;
		if (this.user1 === undefined && this.user2 === undefined)
			return (true);
		return (false);
	}

	/* == PRIVATE ================================================================================= */

	/* -- GAMEPLAY ------------------------------ */

	private startGame(): void {
		console.info("Starting game");
		return ;
		const ball: BallDto = this.initBall();
		//setInterval(refreshBall, 20, ball);
	}

	private /* async */ refreshBall(old_ball: BallDto): BallDto {
		// Check game data accuracy
		// Add to DB
		// Send back as refreshed version
		console.info(old_ball);
		return old_ball;
	}

	/* Generate random initial direction for ball */
	private initBall(): BallDto {
		const x: number = Math.random();
		const y: number = Math.random();
		const v_norm: number = Math.sqrt(x * x + y * y);
		return {
			x: x,
			y: y,
			vx: x / v_norm,
			vy: y / v_norm,
		};
	}
}
