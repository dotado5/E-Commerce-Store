import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.usersRepository.createUser(data);
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findUserByEmail(email);
  }

  async findOneById(id: number): Promise<User | null> {
    return this.usersRepository.findUserById(id);
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.usersRepository.updateUser(id, data);
  }

  async remove(id: number): Promise<User> {
    return this.usersRepository.deleteUser(id);
  }
}
