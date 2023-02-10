export class CodeIsNotSet implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "CodeIsNotSet";
		this._message = "No 2FA code has been set for this account";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
