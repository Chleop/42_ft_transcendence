export class UnknownError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "UnknownError";
		this._message = "Unknown error";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
