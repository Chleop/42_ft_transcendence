export class ChannelInvitationUnexpectedError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelInvitationUnexpectedError";
		this._message = "Unexpected provided channel invitation";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
