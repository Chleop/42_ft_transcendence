export class InvalidCode implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "InvalidCode";
		this._message = "Invalid code";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
