export class UserSelfGetError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserSelfGetError";
		this._message = "User cannot get themself this way. Use `GET /api/user/@me` route instead";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
