import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AccountsModule } from './accounts/accounts.module';
import { BalanceHistoryModule } from './balance-history/balance-history.module';
import { HederaModule } from './hedera/hedera.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'hedera_stalker',
      password: process.env.DB_PASSWORD || 'hedera_stalker_password',
      database: process.env.DB_DATABASE || 'hedera_stalker',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.DB_SYNCHRONIZE === 'true' || false, // Only true if explicitly set
      logging: process.env.DB_LOGGING === 'true' || false,
    }),
    ScheduleModule.forRoot(),
    AccountsModule,
    BalanceHistoryModule,
    HederaModule,
    SchedulerModule,
    DashboardModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

