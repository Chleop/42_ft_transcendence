import { IsNotEmpty, IsString } from "class-validator";

export class ChannelPromoteMemberDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
