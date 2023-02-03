import { IsNumberString, Length } from "class-validator";

export class CodeDto {
	@IsNumberString()
	@Length(6, 6)
	public code: string;
}
