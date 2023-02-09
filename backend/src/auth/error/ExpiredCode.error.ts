export class ExpiredCode implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ExpiredCode";
		this._message = "Expired code";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
