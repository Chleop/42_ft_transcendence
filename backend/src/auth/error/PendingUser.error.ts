export class PendingUser implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "PendingUser";
		this._message = "User is pending 2FA validation";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
