import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma.service.js';
import { MahallsController } from './mahalls.controller.js';
import { AuthController } from './auth.controller.js';
import { ReadinessController } from './readiness.controller.js';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController, ReadinessController, MahallsController, AuthController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
