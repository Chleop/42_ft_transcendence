export class FailedMatchmaking implements Error {
	public readonly name: string;
	public readonly message: string;

	constructor(msg: string) {
		this.name = "FailedMatchmaking";
		this.message = msg;
	}
}
