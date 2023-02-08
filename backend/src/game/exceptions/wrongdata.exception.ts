/**
 * Thrown when the data doesn't match what is expected.
 */
export class WrongData implements Error {
	public readonly name: string;
	public readonly message: string;

	constructor(msg: string) {
		this.name = "WrongData";
		this.message = msg;
	}
}
