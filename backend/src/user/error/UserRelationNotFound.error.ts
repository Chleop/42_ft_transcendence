export class UserRelationNotFoundError implements Error {
	private _name: string;
	private _message: string;

	constructor() {
		this._name = "UserRelationNotFoundError";
		this._message = "User relation not found";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
