export class ChannelInvitationMissingError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor() {
		this._name = "ChannelInvitationMissingError";
		this._message = "No channel invitation provided although it is required";
	}

	public get name(): string {
		return this._name;
	}

	public get message(): string {
		return this._message;
	}
}
