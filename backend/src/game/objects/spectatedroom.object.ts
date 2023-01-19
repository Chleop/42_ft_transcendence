export class SpectatedRoom {
	public name: string;
	public ping_id: NodeJS.Timer;
	public number_spectator: number;

	constructor(name: string, id: NodeJS.Timer) {
		this.name = name;
		this.ping_id = id;
		this.number_spectator = 1;
	}

	public isEmpty(): boolean {
		if (this.number_spectator !== 0) return true;
		return false;
	}
}
