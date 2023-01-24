export class FriendRequestSelfRejectError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "FriendRequestSelfRejectError";
		this._message = "User cannot reject friend request from themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
