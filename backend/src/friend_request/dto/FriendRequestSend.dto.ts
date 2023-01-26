import { IsNotEmpty, IsString } from "class-validator";

export class FriendRequestSendDto {
	@IsString()
	@IsNotEmpty()
	public receiving_user_id: string = "";
}
