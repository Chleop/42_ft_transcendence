import * as Constants from "../constants/constants";

export class ScoreUpdate {
	private readonly opponent: number;
	private readonly you: number;
	private readonly just_scored: string;
	private is_ongoing: boolean;

	constructor(score_1: number, score_2: number, left: boolean) {
		this.opponent = score_1;
		this.you = score_2;
		if (left) this.just_scored = "you";
		else this.just_scored = "opponent";
		if (score_1 === Constants.max_score) this.is_ongoing = false;
		else this.is_ongoing = true;
		this.just_scored; // stupid line for this stupid tsconfig
		this.is_ongoing;
	}

	public invert(): ScoreUpdate {
		const who: boolean = this.just_scored === "you" ? false : true;
		return new ScoreUpdate(this.you, this.opponent, who);
	}
}
