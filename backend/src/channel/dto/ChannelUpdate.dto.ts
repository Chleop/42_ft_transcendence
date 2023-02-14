import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ChanType } from "@prisma/client";

export class ChannelUpdateDto {
	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public name?: string;

	@IsEnum(ChanType)
	@IsOptional()
	public type?: ChanType;

	@IsNotEmpty()
	@IsOptional()
	@IsString()
	public password?: string;
}
