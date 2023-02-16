export class ChannelMemberAlreadyDemotedError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor(details?: string) {
		this._name = "ChannelMemberAlreadyDemotedError";
		this._message = "Channel member has already been demoted";
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
