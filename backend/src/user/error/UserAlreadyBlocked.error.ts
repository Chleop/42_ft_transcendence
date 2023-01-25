export class UserAlreadyBlockedError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserAlreadyBlockedError";
		this._message = "User is already blocked";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
