import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameModule } from './game/game.module';

// TODO: Delete this when file server is set up.
import { FileModule } from "./file.module";
import { FileController } from "./file.controller";

@Module({
  imports: [GameModule, FileModule],
  controllers: [AppController, FileController],
  providers: [AppService]
})
export class AppModule {}
