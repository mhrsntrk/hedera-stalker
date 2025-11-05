import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly telegramBotToken: string | undefined;
  private readonly lowBalanceThreshold: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.lowBalanceThreshold = parseFloat(
      this.configService.get<string>('LOW_BALANCE_THRESHOLD') || '1',
    );

    if (this.telegramBotToken) {
      this.logger.log('Telegram notifications enabled (subscription-based)');
    } else {
      this.logger.warn(
        'Telegram notifications disabled - TELEGRAM_BOT_TOKEN not set',
      );
    }
  }

  /**
   * Send a notification when account balance is below threshold
   * Sends to all active subscribers
   */
  async notifyLowBalance(
    accountId: string,
    accountName: string | null,
    balance: number,
  ): Promise<void> {
    if (balance >= this.lowBalanceThreshold) {
      return; // Balance is not low enough
    }

    const displayName = accountName || accountId;
    const message = `⚠️ *Low Balance Alert*\n\n` +
      `Account: ${displayName}\n` +
      `Account ID: \`${accountId}\`\n` +
      `Current Balance: *${balance.toFixed(4)} HBAR*\n` +
      `Threshold: ${this.lowBalanceThreshold} HBAR\n\n` +
      `The account balance is below the threshold!`;

    // Send to all active subscribers
    const subscribers = await this.subscriptionsService.getAllActiveSubscriptions();
    
    if (subscribers.length === 0) {
      this.logger.warn('No active subscribers - notification not sent');
      return;
    }

    this.logger.log(`Sending notification to ${subscribers.length} subscriber(s)`);
    
    // Send to all subscribers (don't await all, fire and forget)
    const sendPromises = subscribers.map(subscriber =>
      this.sendTelegramMessage(subscriber.chatId, message).catch(error => {
        this.logger.error(
          `Failed to send notification to chat ${subscriber.chatId}: ${error.message}`,
        );
      }),
    );

    await Promise.allSettled(sendPromises);
  }

  /**
   * Send a test notification to all active subscribers
   */
  async sendTestNotification(): Promise<boolean> {
    const message = `✅ *Hedera Stalker Test Notification*\n\n` +
      `This is a test message to verify Telegram notifications are working correctly.`;

    const subscribers = await this.subscriptionsService.getAllActiveSubscriptions();
    
    if (subscribers.length === 0) {
      this.logger.warn('No active subscribers - test notification not sent');
      return false;
    }

    this.logger.log(`Sending test notification to ${subscribers.length} subscriber(s)`);
    
    const sendPromises = subscribers.map(subscriber =>
      this.sendTelegramMessage(subscriber.chatId, message).catch(error => {
        this.logger.error(
          `Failed to send test notification to chat ${subscriber.chatId}: ${error.message}`,
        );
      }),
    );

    const results = await Promise.allSettled(sendPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    
    return successCount > 0;
  }

  /**
   * Send a message via Telegram Bot API to a specific chat ID
   */
  private async sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.telegramBotToken) {
      this.logger.warn('Telegram bot token not configured - skipping notification');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(
          `Failed to send Telegram notification to chat ${chatId}: ${JSON.stringify(error)}`,
        );
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error sending Telegram notification to chat ${chatId}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Check if notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    if (!this.telegramBotToken) {
      return false;
    }
    
    const subscribers = await this.subscriptionsService.getAllActiveSubscriptions();
    return subscribers.length > 0;
  }

  /**
   * Get the low balance threshold
   */
  getLowBalanceThreshold(): number {
    return this.lowBalanceThreshold;
  }
}

