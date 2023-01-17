export class ScoreUpdate {
	private readonly opponent: number;
	private readonly you: number;
	private readonly just_scored: string;

	constructor(score_1: number, score_2: number, left: boolean) {
		this.opponent = score_1;
		this.you = score_2;
		if (left) this.just_scored = "you";
		else this.just_scored = "opponent";
		this.just_scored; // stupid line for this stupid tsconfig
	}

	public invert(): ScoreUpdate {
		return new ScoreUpdate(this.you, this.opponent, this.just_scored !== "you");
	}
}
