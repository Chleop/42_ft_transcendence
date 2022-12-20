import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class UserUpdateDto {
	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public name?: string;

	@IsEmail()
	// @IsNotEmpty()
	@IsOptional()
	@IsString()
	public email?: string;

	@IsBoolean()
	@IsOptional()
	public two_fact_auth?: boolean;

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public skin_id?: string;
}
