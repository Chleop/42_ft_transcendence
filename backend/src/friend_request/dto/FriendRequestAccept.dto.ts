import { IsNotEmpty, IsString } from "class-validator";

export class FriendRequestAcceptDto {
	@IsString()
	@IsNotEmpty()
	public accepted_user_id: string = "";
}
