import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // Public runtime config for the storefront — keeps the publishable key
  // out of the frontend build so one image works in every environment.
  @Get('config')
  getConfig() {
    return {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? null,
    };
  }

  // Called by Stripe, not by users — authenticated via webhook signature.
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.handleWebhook(req.rawBody, signature);
  }
}
