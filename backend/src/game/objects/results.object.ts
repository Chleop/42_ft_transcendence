import { Score } from "../aliases";
import { PlayerData } from "./";

function getCurrentTime(date: Date): string {
	const day: string = ("0" + date.getDate()).slice(-2);
	const month: string = ("0" + (date.getMonth() + 1)).slice(-2);
	return (
		date.getFullYear() +
		"-" +
		month +
		"-" +
		day +
		" " +
		date.getHours() +
		":" +
		date.getMinutes() +
		":" +
		date.getSeconds()
	);
}

export class ResultsObject {
	public readonly player1: PlayerData;
	public readonly player2: PlayerData;
	public readonly date: string;

	constructor(score: Score, guilty?: number) {
		//player1: PlayerData, player2: PlayerData) {
		const date: Date = new Date();

		if (guilty === undefined) {
			this.player1 = new PlayerData(score.player1_score);
			this.player2 = new PlayerData(score.player1_score);
		} else {
			if (guilty === 1) {
				this.player1 = new PlayerData(score.player1_score, false);
				this.player2 = new PlayerData(score.player1_score, true);
			} else {
				this.player1 = new PlayerData(score.player1_score, true);
				this.player2 = new PlayerData(score.player1_score, false);
			}
		}
		this.date = getCurrentTime(date);
	}
}
