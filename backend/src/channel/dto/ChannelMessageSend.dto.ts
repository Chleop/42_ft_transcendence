import { IsNotEmpty, IsString } from "class-validator";

export class ChannelMessageSendDto {
	@IsNotEmpty()
	@IsString()
	public message: string = "";
}
