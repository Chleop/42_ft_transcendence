import {
    Controller,
    Post,
    Body,
    Get,
    ForbiddenException,
    InternalServerErrorException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { e_status } from 'src/user/enum';
import { AuthService } from './auth.service';
import { TokenAuthDto } from './dto';

@Controller('auth')
export class AuthController {
    private _authService: AuthService;

    constructor(authService: AuthService) {
        this._authService = authService;
    }

    // voir comment on recupere le token
    // voir s'il faut ajouter un dto pour chaque route
    // @Get('42callback/name')
    // async signin(@Body('name') name: string) {
    //     type t_ret = e_status;

    //     const ret: t_ret = await this._authService.signin(name);
    //     switch (ret) {
	// 		case e_status.SUCCESS:
	// 			break;
	// 		case e_status.ERR_USER_FIELD_UNAVAILABLE:
	// 			throw new ForbiddenException("One of the provided fields is already taken");
	// 		case e_status.ERR_USER_RELATION_NOT_FOUND:
	// 			throw new ForbiddenException("One of the provided relations does not exist");
	// 		case e_status.ERR_UNKNOWN:
	// 			throw new InternalServerErrorException("An unknown error occured");
	// 	}

    // }

    @Post('42callback/name')
    async signin(@Body('name') name: string) {
        type t_access_token = { access_token: string | undefined; };
        var token: t_access_token;
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
        }
    }

};

