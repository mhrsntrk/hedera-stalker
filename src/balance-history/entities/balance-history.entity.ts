import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';

@Entity('balance_history')
@Index(['account', 'recordedAt'])
export class BalanceHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Account, (account) => account.balanceHistory)
  @JoinColumn({ name: 'accountId' })
  account: Account;

  @Column()
  accountId: number;

  @Column('decimal', { precision: 20, scale: 8 })
  balance: number; // Balance in HBARs

  @Column()
  @Index()
  recordedAt: Date; // When the balance was recorded

  @CreateDateColumn()
  createdAt: Date;
}

