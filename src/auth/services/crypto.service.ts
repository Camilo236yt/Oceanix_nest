import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private readonly saltRounds = 10;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  hashPasswordSync(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  comparePasswordsSync(plainPassword: string, hashedPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<void> {
    const isValid = await bcrypt.compare(plainPassword, hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  validatePasswordSync(plainPassword: string, hashedPassword: string): void {
    const isValid = bcrypt.compareSync(plainPassword, hashedPassword);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
