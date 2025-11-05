import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(Subscription)
    private subscriptionsRepository: Repository<Subscription>,
  ) {}

  async subscribe(chatId: string, firstName?: string, username?: string): Promise<Subscription> {
    try {
      // Check if already subscribed
      let subscription = await this.subscriptionsRepository.findOne({
        where: { chatId },
      });

      if (subscription) {
        // Reactivate if previously unsubscribed
        if (!subscription.isActive) {
          subscription.isActive = true;
          subscription.firstName = firstName || subscription.firstName;
          subscription.username = username || subscription.username;
          await this.subscriptionsRepository.save(subscription);
          this.logger.log(`Reactivated subscription for chat ID: ${chatId}`);
        } else {
          this.logger.log(`Chat ID ${chatId} is already subscribed`);
        }
        return subscription;
      }

      // Create new subscription
      subscription = this.subscriptionsRepository.create({
        chatId,
        firstName,
        username,
        isActive: true,
      });

      await this.subscriptionsRepository.save(subscription);
      this.logger.log(`New subscription created for chat ID: ${chatId}`);
      return subscription;
    } catch (error) {
      this.logger.error(
        `Error subscribing chat ID ${chatId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async unsubscribe(chatId: string): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { chatId },
    });

    if (!subscription || !subscription.isActive) {
      return false;
    }

    subscription.isActive = false;
    await this.subscriptionsRepository.save(subscription);
    this.logger.log(`Unsubscribed chat ID: ${chatId}`);
    return true;
  }

  async isSubscribed(chatId: string): Promise<boolean> {
    const subscription = await this.subscriptionsRepository.findOne({
      where: { chatId, isActive: true },
    });
    return !!subscription;
  }

  async getAllActiveSubscriptions(): Promise<Subscription[]> {
    return await this.subscriptionsRepository.find({
      where: { isActive: true },
      order: { subscribedAt: 'ASC' },
    });
  }

  async getSubscription(chatId: string): Promise<Subscription | null> {
    return await this.subscriptionsRepository.findOne({
      where: { chatId },
    });
  }
}

