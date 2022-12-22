import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserCreateDto } from 'src/user/dto';
import { e_status } from 'src/user/enum';
import { UserService } from 'src/user/user.service';
import { TokenAuthDto } from './dto';

// @Injectable()
// export class AuthService {
//     private readonly _user: UserService;
//     private _jwt: JwtService;
//     private _config: ConfigService;
//     private _prisma: PrismaService;

//     constructor(user: UserService, jwt: JwtService, config: ConfigService, prisma: PrismaService) {
//         this._user = user;
//         this._jwt = jwt;
//         this._config = config;
//         this._prisma = prisma;
//     }
    
//     public async signin(username: string): Promise<{
//         access_token: string | undefined;
//         status: e_status;
//     }> 
//     {

//         // define types
//         type t_ret = {
// 			access_token: string | undefined;
// 			status: e_status;
// 		};

//         // create user object
//         const userObj: UserCreateDto = {
//             name: username,
//         }
    
//         // create new user in the database
//         const status: e_status = await this._user.create_one(userObj);

//         // get the id of the user created (normalement plus a 
//         // faire si Jonathan renvoi le user dans le create one)
//         const user = await this._prisma.user.findUnique({
//             where: {
//                 name: username,
//             },
//         });
    
//         // create access_token
//         const access_token: string | undefined = await this.signToken(user?.id);

//         return {
//             access_token,
// 			status,
//         };
//     };

//     public async signToken(userId: string | undefined) : Promise<string> {
//         const oursecret: string | undefined = this._config.get<string>('JWT_SECRET');
//         if (oursecret === undefined)
// 			throw new Error("JWT_SECRET is undefined!");
//         const access_token: string | undefined = await this._jwt.signAsync(
//             { sub: userId }, 
//             { secret: oursecret, expiresIn: '1h'},
//             );
//         if (!access_token)
//             throw new Error("JWT signAsync function error"); 
//         return access_token;
//     }
    
// };

@Injectable()
export class AuthService {
    private readonly _user: UserService;
    private _jwt: JwtService;
    private _config: ConfigService;
    private _prisma: PrismaService;

    constructor(user: UserService, jwt: JwtService, config: ConfigService, prisma: PrismaService) {
        this._user = user;
        this._jwt = jwt;
        this._config = config;
        this._prisma = prisma;
    }
    
    public async signin(username: string): Promise<string | undefined> {
        // create new user in the database
        const user = await this._prisma.user.create({
            data: {
                name: username,
                skin: {
                    connect: { name: "Default" }
                },
            }
        })

        // create access_token
        const access_token: string | undefined = await this.signToken(user.id);

        return access_token ;
    };

    public async signToken(userId: string | undefined) : Promise<string> {
        
        const oursecret: string | undefined = this._config.get<string>('JWT_SECRET');
        if (oursecret === undefined)
			throw new Error("JWT_SECRET is undefined");
        
        const access_token: string | undefined = await this._jwt.signAsync(
            { sub: userId }, 
            { secret: oursecret, expiresIn: '1h'},
        );
        if (!access_token)
            throw new Error("JWT signAsync function error"); 
        
        return access_token;
    }
    
};
