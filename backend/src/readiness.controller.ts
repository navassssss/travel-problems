import {
  Controller,
  Get,
  Header,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('ready')
export class ReadinessController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async check() {
    try {
      await this.prisma.checkConnection();
    } catch {
      throw new ServiceUnavailableException('Database unavailable');
    }

    return { status: 'ready' };
  }
}
