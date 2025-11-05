import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { AccountsModule } from '../accounts/accounts.module';
import { BalanceHistoryModule } from '../balance-history/balance-history.module';
import { HederaModule } from '../hedera/hedera.module';

@Module({
  imports: [AccountsModule, BalanceHistoryModule, HederaModule],
  controllers: [DashboardController],
})
export class DashboardModule {}

