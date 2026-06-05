import { Injectable } from '@nestjs/common';
import { User, Role } from './user.entity';

@Injectable()
export class UsersService {
  // Temporary storage (like a fake database)
  private users: User[] = [];
  private idCounter = 1;

  create(name: string, email: string, password: string, role: Role): User {
    const user: User = {
      id: this.idCounter++,
      name,
      email,
      password,
      role,
    };
    this.users.push(user);
    return user;
  }

  findByEmail(email: string): User | undefined {
    return this.users.find((u) => u.email === email);
  }
}