import { Transform } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ChannelMessagesGetDto {
	@IsNotEmpty()
	@IsOptional()
	public before?: string;

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public after?: string;

	@IsInt()
	@IsNumber()
	@IsOptional()
	@Min(1)
	@Transform(({ value }) => Number(value))
	public limit: number = 20;
}
