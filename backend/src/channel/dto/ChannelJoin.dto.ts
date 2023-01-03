import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChannelJoinDto {
	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public password?: string;

	// REMIND: This is a temporary solution, see with Nils for the one to use in the end
	@IsNotEmpty()
	@IsString()
	@IsOptional()
	public inviting_user_id?: string;

	// TODO: Remove this when the authentification is implemented
	@IsNotEmpty()
	@IsString()
	public joining_user_id: string = "";
}
