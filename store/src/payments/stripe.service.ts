import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe | null = null;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;

    if (key) {
      this.stripe = new Stripe(key);
      this.logger.log(
        `Stripe configured${key.startsWith('sk_test') ? ' (test mode)' : ''}`,
      );
    } else {
      this.logger.warn(
        'STRIPE_SECRET_KEY not set — payments disabled; orders are created without a payment intent',
      );
    }
  }

  isEnabled(): boolean {
    return this.stripe !== null;
  }

  async createPaymentIntent(
    orderId: number,
    total: Prisma.Decimal,
    receiptEmail?: string,
  ): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) return null;

    return this.stripe.paymentIntents.create({
      // Stripe amounts are integers in the smallest currency unit.
      amount: Math.round(total.toNumber() * 100),
      currency: process.env.STRIPE_CURRENCY ?? 'usd',
      receipt_email: receiptEmail,
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: String(orderId) },
    });
  }

  async retrievePaymentIntent(
    id: string,
  ): Promise<Stripe.PaymentIntent | null> {
    if (!this.stripe) return null;
    return this.stripe.paymentIntents.retrieve(id);
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
