import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ChannelMessageGetDto {
	@IsNotEmpty()
	@IsOptional()
	public before?: string;

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public after?: string;

	@IsNumber()
	@IsOptional()
	@Min(1)
	@Transform(({ value }) => Number(value))
	public limit: number = 20;
}
