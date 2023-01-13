import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ChannelCreateDto {
	@IsNotEmpty()
	@IsString()
	public name: string = "";

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public password?: string;

	@IsBoolean()
	public is_private: boolean = false;

	// TODO: Remove this when the authentification is implemented
	@IsNotEmpty()
	@IsString()
	public user_id: string = "";
}
