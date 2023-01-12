import { IsNotEmpty, IsString } from "class-validator";

export class ChannelLeaveDto {
	// TODO: Remove this when the authentification is implemented
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
