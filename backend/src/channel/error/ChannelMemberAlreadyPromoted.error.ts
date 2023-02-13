export class ChannelMemberAlreadyPromotedError implements Error {
	private readonly _name: string;
	private readonly _message: string;

	constructor(details?: string) {
		this._name = "ChannelMemberAlreadyPromotedError";
		this._message = "Channel member has already been promoted";
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
