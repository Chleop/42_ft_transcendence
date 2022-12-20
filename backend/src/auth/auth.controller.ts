import {
    Controller,
    Post,
    Body,
    Get,
} from '@nestjs/common';
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
    @Get('42callback/name')
    createUserAndAccessToken(@Body('name') name: string) {
        return this._authService.createUserAndAccessToken(name);
    }

};
