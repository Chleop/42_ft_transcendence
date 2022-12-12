import { Controller, Get, Post, Delete, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { User, PrismaClient, Skin } from '@prisma/client';

@Controller('user')
export class UserController {
    constructor(private userService: UserService) {}

    // @Post('createuser')
    // createuser() {
    //     // const test : Skin = {
    //     //     id: 4,
    //     //     username: "nana",
    //     //     url: "dsds",
    //     // }
    //     const prisma = new PrismaClient()
    //     const user = prisma.user.create({
    //         data : {
    //             name: 'chleo',
    //             email: 'chleop@hotmail.fr',
    //             avatar: "balbal",
    //             elo: 1,
    //             twoFactAuth: true,
    //             skin: {}
    //             // skinid:0,
    //         },
    //     })
    //         return user;

    // }
}
