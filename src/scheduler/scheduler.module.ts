import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { AccountsModule } from '../accounts/accounts.module';
import { BalanceHistoryModule } from '../balance-history/balance-history.module';
import { HederaModule } from '../hedera/hedera.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SchedulerController } from './scheduler.controller';

@Module({
  imports: [AccountsModule, BalanceHistoryModule, HederaModule, NotificationsModule],
  providers: [SchedulerService],
  controllers: [SchedulerController],
})
export class SchedulerModule {}

