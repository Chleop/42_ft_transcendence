export class ChannelPasswordUnexpectedError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelPasswordUnexpectedError";
		this._message = "Unexpected provided channel password";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
