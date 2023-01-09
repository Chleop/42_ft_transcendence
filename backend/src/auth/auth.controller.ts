import {
    Controller,
    Post,
    Body,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { AuthService } from './auth.service';

type t_access_token = { access_token: string | undefined; };

@Controller('auth')
export class AuthController {
    private _authService: AuthService;

    constructor(authService: AuthService) {
        this._authService = authService;
    }

    @Post('42callback/name')
    async signin(@Body('name') name: string) {
        let token: t_access_token;
        try {
            token = await this._authService.signin(name);
            return token;
        }
        catch (error) {
            console.info(error);
			if (error instanceof PrismaClientKnownRequestError){
                if (error.code == "P2002")
                throw new ForbiddenException("One of the provided fields is already taken");
            }
			else
                throw new InternalServerErrorException("An unknown error occured");
            return undefined;
        }
    }

};

