import { IsNotEmpty, IsString } from "class-validator";

export class ChannelUnbanMemberDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
