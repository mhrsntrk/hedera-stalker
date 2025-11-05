import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
  ) {}

  async create(accountId: string, name?: string): Promise<Account> {
    const account = this.accountsRepository.create({
      accountId,
      name,
      isActive: true,
    });
    return await this.accountsRepository.save(account);
  }

  async findAll(): Promise<Account[]> {
    return await this.accountsRepository.find({
      where: { isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Account> {
    return await this.accountsRepository.findOne({ where: { id } });
  }

  async findByAccountId(accountId: string): Promise<Account> {
    return await this.accountsRepository.findOne({
      where: { accountId },
    });
  }

  async update(id: number, updates: Partial<Account>): Promise<Account> {
    await this.accountsRepository.update(id, updates);
    return await this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.accountsRepository.delete(id);
  }
}

