import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}
    async signup(signupDto: AuthDto) {
        // generate the password hash
        const hash = await argon.hash(signupDto.password);
        // save the new user in the db
        // const user = await this.prisma.user.cre
        const user = await this.prisma.user.create({
            data: {
                name: signupDto.name,
                email: signupDto.email,
                hash: hash,
                skin: {},
            }
        })
        // return the saved user
        return user;
    };
    signin() {};
}
