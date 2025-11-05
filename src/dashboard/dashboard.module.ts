import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { BalanceHistoryModule } from '../balance-history/balance-history.module';

@Module({
  imports: [AccountsModule, BalanceHistoryModule],
  controllers: [DashboardController],
})
export class DashboardModule {}

