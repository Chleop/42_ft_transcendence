export class FriendRequestAlreadySentError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "FriendRequestAlreadySentError";
		this._message = "Friend request already sent";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
