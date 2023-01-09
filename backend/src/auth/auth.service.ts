import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserCreateDto } from 'src/user/dto';
import { UserService } from 'src/user/user.service';

type t_access_token = { access_token: string | undefined };
type t_payload = { sub: string | undefined };

@Injectable()
export class AuthService {
    private readonly _user: UserService;
    private readonly _config: ConfigService;
    private _jwt: JwtService;
    
    constructor() {
        this._user = new UserService;
        this._jwt = new JwtService;
        this._config = new ConfigService;
    }
        
    public async signin(username: string): Promise < t_access_token > {
        
    // create new user in the database
        const userObj: UserCreateDto = {
            name: username,
        }
        const userId = await this._user.create_one(userObj);
        
    // create access_token object
        
        const payload : t_payload = { sub: userId };
        const tokenObj: t_access_token = await this.signToken(payload);
        
        return tokenObj ;
    };
    
    public async signToken(payload: t_payload) : Promise < t_access_token > {
    
    // get the secret from the .env file
        const oursecret: string | undefined = this._config.get<string>('JWT_SECRET');
        if (oursecret === undefined)
            throw new Error("JWT_SECRET is undefined");
    
    // create the access_token based on user id and jwt secret
        const token: string | undefined = await this._jwt.signAsync(
            { sub: payload.sub }, 
            { secret: oursecret, expiresIn: '1h'},
            );
        if (!token)
            throw new Error("JWT signAsync function error"); 
    
    // include the access_token in an object and return it
        let ret: t_access_token = { access_token : token };
        return ret;
    }
    
};
