export class PlayerData {
	public readonly id: string;
	public readonly score: number;
	public readonly winner: boolean;

	constructor(score: number, has_won: boolean) {
		this.score = score;
		this.winner = has_won;
	}
}
