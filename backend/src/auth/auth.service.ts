import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { TokenAuthDto } from './dto';

@Injectable()
export class AuthService {
    private readonly _user: UserService;
    private readonly _jwt: JwtService;
    private readonly _config: ConfigService;
    private readonly _prisma: PrismaService;

    constructor(user: UserService, jwt: JwtService, config: ConfigService, prisma: PrismaService) {
        this._user = user;
        this._jwt = jwt;
        this._config = config;
        this._prisma = prisma;
    }
    
    public async createUserAndAccessToken(username: string){
        // create object type
        type t_user = {
            name: string;
			email: string;
			two_fact_auth: boolean;
            two_fact_secret: string;
		};
        // create user object
        const userObj: t_user = {
            name: username,
            email: "",
			two_fact_auth: false,
            two_fact_secret: "",
        };
        // save the new user in the db
        return this._user.create_one(userObj);
// TODO: recuperer les erreurs de create_one

        // get the user created into a variable
        const user = await this._prisma.user.findUnique({
			where: {
				name: username,
			},
		});

        // create access_token
        this.signToken(user?.id);
    };

    public async signToken(userId: string | undefined) : Promise<string> {
        const oursecret: string | undefined = this._config.get<string>('JWT_SECRET');

        return this._jwt.signAsync(
            { data: userId }, 
            { secret: oursecret, expiresIn: '1h'},
            )
    }
    
};

    // public async createUserAndAccessToken(username: string){
    //     // save the new user in the db
    //     const user = await this._prisma.user.create({
    //         data: {
    //             name: username,
    //             skin: {
    //                 connect: { name: "Default" }
    //             },
    //         }
    //     })
    //     return user.id;
    // };
