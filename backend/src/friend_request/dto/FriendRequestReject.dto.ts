import { IsNotEmpty, IsString } from "class-validator";

export class FriendRequestRejectDto {
	@IsString()
	@IsNotEmpty()
	public rejected_user_id: string = "";
}
