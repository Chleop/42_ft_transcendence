export class ChannelMessageNotFoundError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor(details?: string) {
		this._name = "ChannelMessageNotFoundError";
		this._message = "No such channel message";
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
