export class PlayerData {
	//public readonly id: string;
	public readonly score: number;
	public readonly winner: boolean;

	constructor(/* id: string, */ score: number, has_win: boolean) {
		//this.id = id;
		this.score = score;
		this.winner = has_win;
	}
}
