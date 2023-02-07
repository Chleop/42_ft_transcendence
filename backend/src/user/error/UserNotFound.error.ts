export class UserNotFoundError implements Error {
	private readonly _name: string;
	private _message: string;

	constructor(details?: string) {
		this._name = "UserNotFoundError";
		this._message = "No such user";
		if (details) {
			this._message += ` (${details})`;
		}
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}

	public set message(message: string) {
		this._message = message;
	}
}
