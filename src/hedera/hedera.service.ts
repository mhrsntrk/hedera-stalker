import { Injectable, Logger } from '@nestjs/common';
import {
  Client,
  AccountId,
  AccountBalanceQuery,
} from '@hashgraph/sdk';

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);
  private client: Client;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    const network = process.env.HEDERA_NETWORK || 'testnet';
    
    switch (network) {
      case 'mainnet':
        this.client = Client.forMainnet();
        break;
      case 'testnet':
        this.client = Client.forTestnet();
        break;
      case 'previewnet':
        this.client = Client.forPreviewnet();
        break;
      default:
        this.client = Client.forTestnet();
    }

    this.logger.log(`Initialized Hedera client for ${network}`);
  }

  async getAccountBalance(accountIdString: string): Promise<number> {
    try {
      const accountId = AccountId.fromString(accountIdString);
      const query = new AccountBalanceQuery().setAccountId(accountId);
      const balance = await query.execute(this.client);
      
      // balance.hbars is an Hbar object
      // The toString() method should return the value in HBARs as a string
      // Try to get the numeric value directly
      const hbarString = balance.hbars.toString();
      const hbars = parseFloat(hbarString.split(' ')[0]); // Parse "XX.XXXXX ℏ" format
      
      // If that doesn't work, fall back to tinybars conversion
      if (isNaN(hbars)) {
        const tinybars = balance.hbars.toTinybars();
        const tinybarsNum = typeof tinybars === 'bigint' 
          ? Number(tinybars) 
          : Number(tinybars.toString());
        const hbarsFromTinybars = tinybarsNum / 100000000;
        this.logger.log(`Balance for ${accountIdString}: ${hbarsFromTinybars} HBAR (from tinybars: ${tinybarsNum})`);
        return hbarsFromTinybars;
      }
      
      this.logger.log(`Balance for ${accountIdString}: ${hbars} HBAR`);
      return hbars;
    } catch (error) {
      this.logger.error(
        `Error fetching balance for ${accountIdString}: ${error.message}`,
      );
      throw error;
    }
  }

  async getAccountBalances(accountIds: string[]): Promise<Map<string, number>> {
    const balances = new Map<string, number>();
    
    for (const accountId of accountIds) {
      try {
        const balance = await this.getAccountBalance(accountId);
        balances.set(accountId, balance);
      } catch (error) {
        this.logger.error(`Failed to fetch balance for ${accountId}`);
        // Continue with other accounts even if one fails
      }
    }
    
    return balances;
  }
}

