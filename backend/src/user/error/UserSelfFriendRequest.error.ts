export class UserSelfFriendRequestError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserSelfFriendRequestError";
		this._message = "User cannot friend request themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
