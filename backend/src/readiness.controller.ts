import {
  Controller,
  Get,
  Header,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service.js';

@Controller('ready')
export class ReadinessController {
  private readonly logger = new Logger(ReadinessController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async check() {
    try {
      await this.prisma.checkConnection();
    } catch (error) {
      const code =
        error instanceof Prisma.PrismaClientInitializationError
          ? error.errorCode
          : error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : undefined;
      this.logger.warn(`Database readiness check failed (${code ?? 'no Prisma error code'})`);
      throw new ServiceUnavailableException('Database unavailable');
    }

    return { status: 'ready' };
  }
}
