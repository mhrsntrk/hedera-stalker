import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountsService } from '../accounts/accounts.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';
import { HederaService } from '../hedera/hedera.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceHistoryService: BalanceHistoryService,
    private readonly hederaService: HederaService,
  ) {}

  // Run every hour at the top of the hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyBalanceCheck() {
    this.logger.log('Starting hourly balance check...');
    
    try {
      const accounts = await this.accountsService.findAll();
      
      if (accounts.length === 0) {
        this.logger.log('No accounts to check');
        return;
      }

      const accountIds = accounts.map((acc) => acc.accountId);
      const balances = await this.hederaService.getAccountBalances(accountIds);

      const now = new Date();
      
      for (const account of accounts) {
        const balance = balances.get(account.accountId);
        
        if (balance !== undefined) {
          await this.balanceHistoryService.create(
            account.id,
            balance,
            now,
          );
          this.logger.log(
            `Recorded balance for ${account.accountId}: ${balance} HBAR`,
          );
        }
      }

      this.logger.log('Hourly balance check completed');
    } catch (error) {
      this.logger.error(`Error in hourly balance check: ${error.message}`);
    }
  }

  // Manual trigger method for testing
  async triggerBalanceCheck() {
    await this.handleHourlyBalanceCheck();
  }
}

