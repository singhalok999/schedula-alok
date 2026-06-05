import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { Role } from '../users/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup(name: string, email: string, password: string, role: Role) {
    // Check if user already exists
    const existing = this.usersService.findByEmail(email);
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // Hash the password (never save plain password!)
    const hashed = await bcrypt.hash(password, 10);

    // Save the user
    const user = this.usersService.create(name, email, hashed, role);

    return { message: 'Signup successful', userId: user.id, role: user.role };
  }

  async login(email: string, password: string) {
    // Find user
    const user = this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create JWT token
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return { message: 'Login successful', token, role: user.role };
  }
}