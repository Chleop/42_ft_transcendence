export class UserSelfBlockError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserSelfBlockError";
		this._message = "User cannot block themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
