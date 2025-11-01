import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login-auth.dto';


@Injectable()
export class AuthService {
  login(createAuthDto: LoginDto) {
    return 'This action adds a new auth';
  }

  register() {
    return `This action returns all auth`;
  }

 
}
