import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class EmailDto {
	@IsEmail()
	@IsNotEmpty()
	@IsString()
	public email: string;
}
