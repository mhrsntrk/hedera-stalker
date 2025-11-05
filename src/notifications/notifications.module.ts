import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  providers: [NotificationsService],
  controllers: [TelegramWebhookController],
  exports: [NotificationsService],
})
export class NotificationsModule {}

