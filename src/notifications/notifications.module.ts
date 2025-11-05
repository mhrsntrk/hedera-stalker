import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { TelegramWebhookController } from './telegram-webhook.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AccountsModule } from '../accounts/accounts.module';
import { HederaModule } from '../hedera/hedera.module';

@Module({
  imports: [SubscriptionsModule, AccountsModule, HederaModule],
  providers: [NotificationsService],
  controllers: [TelegramWebhookController],
  exports: [NotificationsService],
})
export class NotificationsModule {}

