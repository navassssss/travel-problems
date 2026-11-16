import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Controller('mahalls')
export class MahallsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.client.mahall.findMany({
      select: { id: true, name: true, locality: true },
      orderBy: [{ name: 'asc' }, { locality: 'asc' }, { id: 'asc' }],
    });
  }
}
