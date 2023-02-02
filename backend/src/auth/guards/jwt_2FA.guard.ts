import { Injectable } from "@nestjs/common";
import { JwtGuard } from ".";

@Injectable()
export class Jwt2FAGuard extends JwtGuard {}
