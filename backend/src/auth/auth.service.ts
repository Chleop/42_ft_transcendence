import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';


@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService) {}
    async login(signupDto: AuthDto) {
        // generate the password hash
        // const hash = await argon.hash(signupDto.password);
        // save the new user in the db
        const user = await this.prisma.user.create({
            data: {
                name: signupDto.name,
                email: signupDto.email,
                skin: {
                    create: {
                        name: "skin2",
                        url: "skin2",
                    }
                }
            }
        })
        // return the saved user
        return user;
    };

/*

login:
if access_token && valide && existing user
    res.welcomepage
else if state et code dans le header
    verifie que le state envoye pour la creation de l'appli 42 est bien le meme que celui recu
    recupere le code
    renvoie le code + client_id + client_secret + redirect_uri (welcomepage)
else
    redirect to 42 API
    = redirect to https://api.intra.42.fr/oauth/authorize
    + client_id + client_secret + redirect_uri (42callback??)

42callback:
    recupere le token42
    demande name + email a l'API42 avec le token42
    recupere name + email
    cree un user
    cree un access_token pour le user


*/

}
