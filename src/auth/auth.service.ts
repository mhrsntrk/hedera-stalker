import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a plain text password with a hashed password
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Verify admin password against the stored hash from environment
   */
  async verifyAdminPassword(providedPassword: string): Promise<boolean> {
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!adminPasswordHash) {
      // If no hash is set, password protection is disabled
      return true;
    }

    if (!providedPassword) {
      return false;
    }

    return await this.comparePassword(providedPassword, adminPasswordHash);
  }
}

