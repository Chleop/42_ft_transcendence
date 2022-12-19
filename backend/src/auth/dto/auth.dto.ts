import {
    IsNotEmpty, 
    IsString 
} from "class-validator";

export class TokenAuthDto {
    @IsNotEmpty()
    @IsString()
    public token_42: string = "";
}
