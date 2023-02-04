import { IsNotEmpty, IsString } from "class-validator";

export class UserMessageSendDto {
	@IsNotEmpty()
	@IsString()
	public content: string = "";
}
