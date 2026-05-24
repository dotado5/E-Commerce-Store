import {
  Controller,
  Get,
  UseGuards,
  Request,
  NotFoundException,
  Patch,
  Body,
  Delete,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async getProfile(@Request() req) {
    const user = await this.usersService.findOneById(req.user.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('profile')
  async updateProfile(@Request() req, @Body() data: Record<string, any>) {
    const user = await this.usersService.update(req.user.userId, data);
    const { password, ...result } = user;
    return result;
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('profile')
  async deleteProfile(@Request() req) {
    return this.usersService.remove(req.user.userId);
  }
}
