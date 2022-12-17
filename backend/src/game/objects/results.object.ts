import { PlayerData } from './';

function getCurrentTime(date: Date): string {
	const day: string = ("0" + date.getDate()).slice(-2);
	const month: string = ("0" + (date.getMonth() + 1)).slice(-2);
	return date.getFullYear() + '-' + month + '-' + day + ' '
		+ date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}


export class ResultsObject {
	public readonly player1: PlayerData;
	public readonly player2: PlayerData;
	public readonly date: string;

	constructor(player1: PlayerData, player2: PlayerData) {
		const date: Date = new Date();
		this.player1 = player1;
		this.player2 = player2;
		this.date = getCurrentTime(date);
	}
}
