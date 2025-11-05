import { Controller, Get } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';

@Controller('api/dashboard')
export class DashboardController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly balanceHistoryService: BalanceHistoryService,
  ) {}

  @Get('data')
  async getDashboardData() {
    const accounts = await this.accountsService.findAll();
    
    const dashboardData = await Promise.all(
      accounts.map(async (account) => {
        const latestBalance = await this.balanceHistoryService.getLatestBalance(
          account.id,
        );

        const [dailyChange, weeklyChange, monthlyChange] = await Promise.all([
          this.balanceHistoryService.getBalanceChange(account.id, 'day'),
          this.balanceHistoryService.getBalanceChange(account.id, 'week'),
          this.balanceHistoryService.getBalanceChange(account.id, 'month'),
        ]);

        return {
          id: account.id,
          accountId: account.accountId,
          name: account.name || account.accountId,
          currentBalance: latestBalance ? Number(latestBalance.balance) : 0,
          lastUpdated: latestBalance?.recordedAt || null,
          dailyChange: dailyChange
            ? { ...dailyChange, available: true }
            : {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                available: false,
              },
          weeklyChange: weeklyChange
            ? { ...weeklyChange, available: true }
            : {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                available: false,
              },
          monthlyChange: monthlyChange
            ? { ...monthlyChange, available: true }
            : {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                available: false,
              },
        };
      }),
    );

    return {
      accounts: dashboardData,
      timestamp: new Date().toISOString(),
    };
  }
}

