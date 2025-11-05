import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
      username?: string;
    };
    text?: string;
    date: number;
  };
}

@Controller('api/telegram/webhook')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);
  private readonly telegramBotToken: string | undefined;
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly configService: ConfigService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {
    this.telegramBotToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    this.webhookSecret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: TelegramUpdate) {
    // Verify webhook secret if configured (optional security measure)
    if (this.webhookSecret) {
      // Note: Telegram doesn't send a secret header, but you can implement
      // custom verification logic here if needed
    }

    // Handle message updates
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id.toString();
      const text = message.text?.trim() || '';
      const from = message.from;

      this.logger.log(`Received message from chat ${chatId}: ${text}`);

      // Handle commands
      if (text.startsWith('/')) {
        await this.handleCommand(chatId, text, from, message.chat);
      }
    }

    return { ok: true };
  }

  private async handleCommand(
    chatId: string,
    command: string,
    from: TelegramUpdate['message']['from'] | undefined,
    chat: TelegramUpdate['message']['chat'],
  ) {
    const firstName = from?.first_name || chat.first_name || 'User';
    const username = from?.username || chat.username || undefined;

    try {
      if (command === '/start' || command === '/subscribe') {
        await this.subscriptionsService.subscribe(chatId, firstName, username);
        await this.sendMessage(
          chatId,
          `✅ *Subscribed to notifications*\n\n` +
            `You will now receive alerts when any tracked account balance falls below the threshold.\n\n` +
            `Use /unsubscribe to stop notifications.\n` +
            `Use /status to check your subscription status.`,
        );
      } else if (command === '/unsubscribe') {
        const unsubscribed = await this.subscriptionsService.unsubscribe(chatId);
        if (unsubscribed) {
          await this.sendMessage(
            chatId,
            `👋 *Unsubscribed from notifications*\n\n` +
              `You will no longer receive balance alerts.\n\n` +
              `Use /subscribe to start receiving notifications again.`,
          );
        } else {
          await this.sendMessage(
            chatId,
            `ℹ️ You are not currently subscribed to notifications.\n\n` +
              `Use /subscribe to start receiving notifications.`,
          );
        }
      } else if (command === '/status') {
        const isSubscribed = await this.subscriptionsService.isSubscribed(chatId);
        if (isSubscribed) {
          await this.sendMessage(
            chatId,
            `✅ *You are subscribed*\n\n` +
              `You will receive notifications when account balances are low.\n\n` +
              `Use /unsubscribe to stop notifications.`,
          );
        } else {
          await this.sendMessage(
            chatId,
            `ℹ️ *You are not subscribed*\n\n` +
              `Use /subscribe to start receiving notifications.`,
          );
        }
      } else if (command === '/help') {
        await this.sendMessage(
          chatId,
          `📋 *Available Commands*\n\n` +
            `/start or /subscribe - Subscribe to balance notifications\n` +
            `/unsubscribe - Stop receiving notifications\n` +
            `/status - Check your subscription status\n` +
            `/help - Show this help message`,
        );
      } else {
        await this.sendMessage(
          chatId,
          `❓ Unknown command. Use /help to see available commands.`,
        );
      }
    } catch (error) {
      this.logger.error(`Error handling command: ${error.message}`, error.stack);
      await this.sendMessage(
        chatId,
        `❌ An error occurred. Please try again later.`,
      );
    }
  }

  private async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!this.telegramBotToken) {
      this.logger.warn('Telegram bot token not configured');
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
          text: text,
          parse_mode: 'Markdown',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Failed to send Telegram message: ${JSON.stringify(error)}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error sending Telegram message: ${error.message}`, error.stack);
      return false;
    }
  }
}

