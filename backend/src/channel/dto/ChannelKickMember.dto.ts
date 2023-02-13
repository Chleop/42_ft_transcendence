import { IsNotEmpty, IsString } from "class-validator";

export class ChannelKickMemberDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
