export class UserAlreadySentFriendRequestError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserAlreadySentFriendRequestError";
		this._message = "User has already sent a friend request";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
