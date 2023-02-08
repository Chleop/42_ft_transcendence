/**
 * Thrown when an unexpected event is received.
 */
export class BadEvent implements Error {
	public readonly name: string;
	public readonly message: string;

	constructor(msg: string) {
		this.name = "BadEvent";
		this.message = msg;
	}
}
