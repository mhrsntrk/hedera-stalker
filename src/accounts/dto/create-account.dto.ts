import { IsString, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString()
  @Matches(/^[0-9]+\.[0-9]+\.[0-9]+$/, {
    message: 'Account ID must be in format: 0.0.123456',
  })
  accountId: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Account name must be less than 100 characters' })
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Admin password is required' })
  @MaxLength(200, { message: 'Password must be less than 200 characters' })
  adminPassword?: string;
}

