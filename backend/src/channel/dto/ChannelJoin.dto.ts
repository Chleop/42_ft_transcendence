import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChannelJoinDto {
	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public password?: string;
}
