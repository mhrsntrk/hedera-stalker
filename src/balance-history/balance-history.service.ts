import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { BalanceHistory } from './entities/balance-history.entity';

@Injectable()
export class BalanceHistoryService {
  constructor(
    @InjectRepository(BalanceHistory)
    private balanceHistoryRepository: Repository<BalanceHistory>,
  ) {}

  async create(
    accountId: number,
    balance: number,
    recordedAt: Date,
  ): Promise<BalanceHistory> {
    const history = this.balanceHistoryRepository.create({
      accountId,
      balance,
      recordedAt,
    });
    return await this.balanceHistoryRepository.save(history);
  }

  async getLatestBalance(accountId: number): Promise<BalanceHistory | null> {
    return await this.balanceHistoryRepository.findOne({
      where: { accountId },
      order: { recordedAt: 'DESC' },
    });
  }

  async getBalanceAtTime(
    accountId: number,
    time: Date,
  ): Promise<BalanceHistory | null> {
    return await this.balanceHistoryRepository.findOne({
      where: {
        accountId,
        recordedAt: LessThanOrEqual(time),
      },
      order: { recordedAt: 'DESC' },
    });
  }

  async getBalanceHistory(
    accountId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BalanceHistory[]> {
    const query = this.balanceHistoryRepository.createQueryBuilder('history');
    query.where('history.accountId = :accountId', { accountId });

    if (startDate) {
      query.andWhere('history.recordedAt >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('history.recordedAt <= :endDate', { endDate });
    }

    query.orderBy('history.recordedAt', 'ASC');

    return await query.getMany();
  }

  async getBalanceChange(
    accountId: number,
    period: 'day' | 'week' | 'month',
  ): Promise<{ current: number; previous: number; change: number; changePercent: number } | null> {
    const now = new Date();
    let periodStart: Date;

    switch (period) {
      case 'day':
        // 24 hours ago
        periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        // 7 days ago
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        // 30 days ago
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }

    // Get the latest balance (current)
    const current = await this.getLatestBalance(accountId);
    if (!current) {
      // No balance data available yet
      return null;
    }

    // Get the balance at the start of the period (previous)
    const previous = await this.getBalanceAtTime(accountId, periodStart);
    if (!previous) {
      // Not enough historical data for this period
      return null;
    }

    // Calculate change and percentage
    const currentBalance = Number(current.balance);
    const previousBalance = Number(previous.balance);
    const change = currentBalance - previousBalance;
    const changePercent =
      previousBalance > 0
        ? ((change / previousBalance) * 100)
        : change > 0
          ? 100
          : change < 0
            ? -100
            : 0;

    return {
      current: currentBalance,
      previous: previousBalance,
      change,
      changePercent,
    };
  }
}

