export class ChannelMemberNotOwnerError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor(details?: string) {
		this._name = "ChannelMemberNotOwnerError";
		this._message = "Channel member is not the owner";
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
