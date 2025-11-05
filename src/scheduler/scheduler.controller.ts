import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Controller('api/scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger() {
    // Fire and forget; do not block the request on long-running fetches
    this.schedulerService.triggerBalanceCheck();
    return { status: 'ok', triggeredAt: new Date().toISOString() };
  }
}


