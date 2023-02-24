export class UserEmailAlreadyTakenError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor(details?: string) {
		this._name = "UserEmailAlreadyTakenError";
		this._message = "User email is already taken";
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
