import { Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaClient } from '@prisma/client';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signin')
    signin() {
        const prisma = new PrismaClient({ log: ['query', 'info'] })

        const user = prisma.user.create({
            data: {
                name: 'chleo',
                email: 'chleop@hotmail.fr',
                rank: 4,
                twofactauth: true,
                // avatar: {
                //     create: [
                //         { name: "avatar1" },
                //         { name: "avatar2" },
                //     ]
                // }
            }
        })

        return 'kuku';
    }
    
}
