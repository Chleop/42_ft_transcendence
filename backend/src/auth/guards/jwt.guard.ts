import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
    
    public override handleRequest <TUser = any> (err: any, user: any): TUser {
        if (err)
            throw err;
        else if (!user)
            throw new UnauthorizedException();
        return user;
    }
}