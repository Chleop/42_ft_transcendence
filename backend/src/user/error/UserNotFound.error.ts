export class UserNotFoundError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "UserNotFoundError";
		this._message = "No such user";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
