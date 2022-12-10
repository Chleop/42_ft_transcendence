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

	private startGame(): void {
		console.info("Starting game");
		//setInterval();
	}
}
