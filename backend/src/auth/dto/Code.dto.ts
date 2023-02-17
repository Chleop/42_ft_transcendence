import { IsNumberString, Length } from "class-validator";

export class CodeDto {
	@IsNumberString()
	@Length(1, 6)
	public code: string = "";
}
