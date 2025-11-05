import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BalanceHistory } from '../../balance-history/entities/balance-history.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  accountId: string; // Hedera account ID (e.g., "0.0.123456")

  @Column({ nullable: true })
  name: string; // Optional friendly name

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => BalanceHistory, (history) => history.account)
  balanceHistory: BalanceHistory[];
}

