import { IsNotEmpty, IsString } from "class-validator";

export class ChannelDelegateOwnershipDto {
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
