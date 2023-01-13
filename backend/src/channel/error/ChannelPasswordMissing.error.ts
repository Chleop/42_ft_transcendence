export class ChannelPasswordMissingError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelPasswordMissingError";
		this._message = "No channel password provided although it is required";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
