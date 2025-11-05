import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountsService } from '../accounts/accounts.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';
import { HederaService } from '../hedera/hedera.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceHistoryService: BalanceHistoryService,
    private readonly hederaService: HederaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.logger.log('Scheduler service initialized');
    this.logger.log('Hourly balance check will run automatically every hour');
    this.logger.log('Next scheduled run: At the top of every hour');
  }

  // Run every hour at the top of the hour (e.g., 1:00, 2:00, 3:00)
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyBalanceCheck() {
    const startTime = new Date();
    this.logger.log(`[${startTime.toISOString()}] Starting scheduled hourly balance check...`);
    
    try {
      const accounts = await this.accountsService.findAll();
      
      if (accounts.length === 0) {
        this.logger.log('No accounts to check - skipping balance sync');
        return;
      }

      this.logger.log(`Checking balances for ${accounts.length} account(s)...`);
      const accountIds = accounts.map((acc) => acc.accountId);
      const balances = await this.hederaService.getAccountBalances(accountIds);

      const now = new Date();
      let successCount = 0;
      let failCount = 0;
      
      for (const account of accounts) {
        const balance = balances.get(account.accountId);
        
        if (balance !== undefined) {
          await this.balanceHistoryService.create(
            account.id,
            balance,
            now,
          );
          this.logger.log(
            `✓ Recorded balance for ${account.accountId}: ${balance.toFixed(4)} HBAR`,
          );
          
          // Check for low balance and send notification if needed
          await this.notificationsService.notifyLowBalance(
            account.accountId,
            account.name || null,
            balance,
          );
          
          successCount++;
        } else {
          this.logger.warn(`✗ Failed to fetch balance for ${account.accountId}`);
          failCount++;
        }
      }

      const duration = Date.now() - startTime.getTime();
      this.logger.log(
        `Hourly balance check completed in ${duration}ms - Success: ${successCount}, Failed: ${failCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error in hourly balance check: ${error.message}`,
        error.stack,
      );
    }
  }

  // Manual trigger method for testing
  async triggerBalanceCheck() {
    await this.handleHourlyBalanceCheck();
  }
}

