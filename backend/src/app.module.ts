import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';
import { GameroomModule } from './game/room/gameroom.module';

@Module({
  imports: [GameModule, GameroomModule],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
