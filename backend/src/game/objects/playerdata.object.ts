export class PlayerData {
	public readonly score: number;
	public readonly winner: boolean;

	constructor(score: number, has_win: boolean) {
		this.score = score;
		this.winner = has_win;
	}
}
