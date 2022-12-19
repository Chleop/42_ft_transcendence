import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokenAuthDto } from './dto';

@Injectable({})
export class AuthService {
    // constructor(private prisma: PrismaService) { }

    // public createUserAndAccessToken(tokenAuthDto: TokenAuthDto){
    //     // generate the password hash
    //     // const hash = await argon.hash(signupDto.password);
    //     // save the new user in the db
    //     // const user = await this.prisma.user.create({
    //     //     data: {
    //     //         name: signupDto.name,
    //     //         email: signupDto.email,
    //     //         skin: {
    //     //             create: {
    //     //                 name: "skin2",
    //     //                 url: "skin2",
    //     //             }
    //     //         }
    //     //     }
    //     // })
    //     // return the saved user
    //     console.log("DANS LE SERVICE");

    //     return tokenAuthDto.token_42;
    // };

    signin() {
        console.log("DANS LE SERVICE");
        return { msg: 'nininini' };
    }

}
