import { IsNotEmpty, IsPositive, IsString } from "class-validator";

export class ChannelMuteMemberDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";

	@IsNotEmpty()
	@IsPositive()
	public duration: number = 0;
}
