export class UserBlockedError implements Error {
	private _name: string;
	private _message: string;

	constructor(details?: string) {
		this._name = "UserBlockedError";
		this._message = "Cannot interact with a blocked user";
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
}
