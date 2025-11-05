import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { HederaService } from '../hedera/hedera.service';
import { BalanceHistoryService } from '../balance-history/balance-history.service';
import { AuthService } from '../auth/auth.service';

@Controller('api/accounts')
export class AccountsController {
  constructor(
    private readonly accountsService: AccountsService,
    private readonly hederaService: HederaService,
    private readonly balanceHistoryService: BalanceHistoryService,
    private readonly authService: AuthService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createAccountDto: CreateAccountDto) {
    // Verify admin password using secure hash comparison
    const isValid = await this.authService.verifyAdminPassword(
      createAccountDto.adminPassword || '',
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid admin password');
    }

    // Check if account already exists
    const existing = await this.accountsService.findByAccountId(
      createAccountDto.accountId,
    );
    if (existing) {
      throw new ConflictException(
        `Account ${createAccountDto.accountId} is already being tracked`,
      );
    }
    const account = await this.accountsService.create(
      createAccountDto.accountId,
      createAccountDto.name,
    );

    // Immediately fetch and store initial balance (non-blocking failures)
    try {
      const balance = await this.hederaService.getAccountBalance(
        account.accountId,
      );
      await this.balanceHistoryService.create(account.id, balance, new Date());
    } catch (e) {
      // If initial fetch fails, we still return created; hourly job will retry
    }

    return account;
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(+id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }
}

