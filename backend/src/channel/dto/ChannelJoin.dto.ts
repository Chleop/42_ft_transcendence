import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChannelJoinDto {
	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public password?: string;

	// TODO: Remove this when the authentification is implemented
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
