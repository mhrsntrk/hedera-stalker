import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  chatId: string; // Telegram chat ID (can be user or group)

  @Column({ nullable: true })
  firstName: string; // User's first name from Telegram

  @Column({ nullable: true })
  username: string; // Telegram username (optional)

  @Column({ default: true })
  isActive: boolean; // Can be used to soft-delete subscriptions

  @CreateDateColumn()
  subscribedAt: Date;
}

