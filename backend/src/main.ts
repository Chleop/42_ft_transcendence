import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FileModule } from './file.module';
import { AppModule } from './app.module';

async function bootstrap() {
    // const app = await NestFactory.create(FileModule);
    const app = await NestFactory.create(AppModule);
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.listen(3000);
}
bootstrap();
