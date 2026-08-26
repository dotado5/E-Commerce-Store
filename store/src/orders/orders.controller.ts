import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  checkout(@Request() req) {
    return this.ordersService.checkout(req.user.userId);
  }

  @Get()
  findAll(@Request() req) {
    return this.ordersService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(req.user.userId, id);
  }

  @Post(':id/refresh-payment')
  refreshPayment(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.refreshPayment(req.user.userId, id);
  }
}
