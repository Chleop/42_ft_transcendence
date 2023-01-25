export class FriendRequestSelfAcceptError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "FriendRequestSelfAcceptError";
		this._message = "User cannot accept friend request from themself";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
