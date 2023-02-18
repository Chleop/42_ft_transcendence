export class UserAvatarFileFormatError implements Error {
	private _name: string;
	private _message: string;

	constructor(details?: string) {
		this._name = "UserAvatarFileFormatError";
		this._message = "File format not supported";
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
