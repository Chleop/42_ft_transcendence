export class ScoreUpdate {
	private readonly opponent: number;
	private readonly you: number;
	private readonly just_scored: string;

	constructor(score_1: number, score_2: number, left: boolean) {
		this.you = score_1;
		this.opponent = score_2;
		if (left) this.just_scored = "you";
		else this.just_scored = "opponent";
		this.just_scored; // stupid line for this stupid tsconfig
	}

	public invert(): ScoreUpdate {
		return new ScoreUpdate(this.opponent, this.you, false);
	}
}
