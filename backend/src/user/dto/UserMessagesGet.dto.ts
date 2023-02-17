import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class UserMessagesGetDto {
	@IsNotEmpty()
	@IsOptional()
	public before?: string;

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public after?: string;

	@IsNumber()
	@IsInt()
	@IsOptional()
	@Min(1)
	@Transform(({ value }) => Number(value))
	public limit: number = 20;
}
