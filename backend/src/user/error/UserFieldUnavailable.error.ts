export class UserFieldUnaivalableError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "UserFieldUnaivalableError";
		this._message = "User field unavailable";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
