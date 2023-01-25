export class UserSelfUnblockError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserSelfUnblockError";
		this._message = "User cannot unblock themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
