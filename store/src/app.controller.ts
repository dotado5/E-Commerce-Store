import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Liveness probe for load balancers / ECS container health checks.
  @Get('health')
  getHealth() {
    return { status: 'ok', uptime: process.uptime() };
  }
}
