export class ChannelInvitationIncorrectError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelInvitationIncorrectError";
		this._message = "Incorrect channel invitation";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
