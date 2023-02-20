export class SkinNotFoundError implements Error {
	private readonly _name: string;
	private _message: string;

	constructor(details?: string) {
		this._name = "SkinNotFoundError";
		this._message = "No such skin";
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
