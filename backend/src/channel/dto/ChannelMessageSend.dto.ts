import { IsNotEmpty, IsString } from "class-validator";

export class ChannelMessageSendDto {
	// TODO: Remove this when the authentification is implemented
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";

	@IsNotEmpty()
	@IsString()
	public message: string = "";
}
