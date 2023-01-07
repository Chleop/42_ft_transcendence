export class ChannelPasswordNotAllowedError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelPasswordNotAllowedError";
		this._message = "Channel password is not allowed";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
