import { IsNotEmpty, IsString } from "class-validator";

export class ChannelBanMemberDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
