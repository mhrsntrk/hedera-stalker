import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('api/scheduler')
export class SchedulerController {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('trigger')
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger() {
    // Fire and forget; do not block the request on long-running fetches
    this.schedulerService.triggerBalanceCheck();
    return { status: 'ok', triggeredAt: new Date().toISOString() };
  }

  @Post('test-notification')
  @HttpCode(HttpStatus.OK)
  async testNotification() {
    const success = await this.notificationsService.sendTestNotification();
    const isEnabled = await this.notificationsService.isEnabled();
    return {
      status: success ? 'ok' : 'error',
      message: success
        ? 'Test notification sent successfully to all subscribers'
        : 'Failed to send test notification. Check logs and Telegram configuration. Make sure you have subscribers.',
      notificationsEnabled: isEnabled,
    };
  }
}


