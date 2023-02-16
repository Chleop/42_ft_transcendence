import { IsNotEmpty, IsString } from "class-validator";

export class ChannelDemoteOperatorDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
