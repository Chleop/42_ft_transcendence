import { 
    Controller,
    Post, 
    Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}
    
    @Post('login')
    signup(@Body() signupDto: AuthDto) {
        return this.authService.login(signupDto);
    }
    
}
