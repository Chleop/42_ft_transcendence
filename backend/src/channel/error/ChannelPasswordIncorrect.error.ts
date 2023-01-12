export class ChannelPasswordIncorrectError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelPasswordIncorrectError";
		this._message = "Provided channel password is incorrect";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
