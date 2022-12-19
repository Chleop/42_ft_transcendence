import { IsBoolean, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class UserCreateDto {
	@IsNotEmpty()
	@IsString()
	public name: string = "";

	@IsEmail()
	@IsNotEmpty()
	@IsString()
	public email: string = "";

	@IsBoolean()
	public two_fact_auth: boolean = false;

	@IsString()
	public two_fact_secret: string = "";
}
