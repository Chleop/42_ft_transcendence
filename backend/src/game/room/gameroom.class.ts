import { Gameplay } from '../gameplay/gameplay.class';
import { Client } from '../aliases';

/* Holds info on the gameroom */
export class GameRoom {
	public readonly name: string;
	private user1: Client = undefined;
	private user2: Client = undefined;
	private game: Gameplay;

	constructor(name: string, host: Client) {
		this.name = name;
		this.user1 = host;
		console.log(`Room '${this.name}' created`);
	}

	/* == PUBLIC ================================================================================== */

	public addGuest(player: Client): void {
		if (this.user2 !== undefined) // Ignore for now
			throw 'Room full';
		this.user2 = player;
		console.info("Adding guest ", player.id);
	}

	public removeUser(id: string): boolean {
		if (this.user1.socket_id === id)
			this.user1 = undefined;
		else if (this.user2.socket_id === id)
			this.user2 = undefined;
		if (this.user1 === undefined && this.user2 === undefined)
			return true;
		return false;
	}

	public isClientInRoom(socket_id: string): boolean {
		if (this.user1 !== undefined && this.user1.socket_id === socket_id
				|| this.user2 !== undefined && this.user2.socket_id === socket_id)
		 return true;
	 return false;	 
	}

	/* -- GAMEPLAY ------------------------------ */

	public startGame(): void {
		console.info("Starting game");
		return ;
		this.game.startGame();
		//setInterval(refreshBall, 20, ball);
	}

	/* == PRIVATE ================================================================================= */

}
