export class UserNotBlockedError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserNotBlockedError";
		this._message = "User not blocked";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
