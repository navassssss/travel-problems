import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaService } from './prisma.service.js';
import { ReadinessController } from './readiness.controller.js';

@Module({
  imports: [],
  controllers: [AppController, ReadinessController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
