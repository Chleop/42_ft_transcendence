import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
// import { PrismaService } from '../prisma/prisma.service';
import { TokenAuthDto } from './dto';

@Injectable()
export class AuthService {
    // private readonly _prisma: PrismaService;
    private readonly _user: UserService;

    constructor(user: UserService) {
        this._user = user;
    }

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


    public async createUserAndAccessToken(username: string){
        // create object type
        type t_fields = {
			name: string;
			email: string;
			two_fact_auth: boolean;
            two_fact_secret: string;
		};
        // create user object
        const userObj: t_fields = {
            name: username,
            email: "lalala",
			two_fact_auth: false,
            two_fact_secret: "",
        };
        // save the new user in the db
        return this._user.create_one(userObj);
    };

};
