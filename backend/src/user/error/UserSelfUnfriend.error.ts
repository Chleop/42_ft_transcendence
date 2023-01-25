export class UserSelfUnfriendError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserSelfUnfriendError";
		this._message = "User cannot unfriend themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
