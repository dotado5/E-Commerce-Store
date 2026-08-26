import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from './stripe.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

  async handleWebhook(payload: Buffer | undefined, signature: string) {
    if (!payload) {
      throw new BadRequestException('Missing request body');
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(payload, signature);
    } catch (err) {
      this.logger.warn(
        `Webhook signature verification failed: ${(err as Error).message}`,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
      case 'payment_intent.processing':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
        await this.applyIntentUpdate(event.data.object);
        break;
      default:
        this.logger.debug(`Ignoring webhook event ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Maps a payment intent's state onto the matching order. Shared by the
   * webhook handler and the manual refresh endpoint.
   */
  async applyIntentUpdate(intent: Stripe.PaymentIntent) {
    const { paymentStatus, orderStatus } = this.mapIntentStatus(intent);

    const result = await this.prisma.order.updateMany({
      where: { paymentIntentId: intent.id },
      data: {
        paymentStatus,
        ...(orderStatus ? { status: orderStatus } : {}),
      },
    });

    if (result.count === 0) {
      this.logger.warn(`No order found for payment intent ${intent.id}`);
    } else {
      this.logger.log(
        `Payment intent ${intent.id} (${intent.status}) → order #${intent.metadata?.orderId ?? '?'} paymentStatus=${paymentStatus}`,
      );
    }
  }

  private mapIntentStatus(intent: Stripe.PaymentIntent): {
    paymentStatus: string;
    orderStatus?: string;
  } {
    switch (intent.status) {
      case 'succeeded':
        return { paymentStatus: 'PAID', orderStatus: 'COMPLETED' };
      case 'processing':
        return { paymentStatus: 'PROCESSING' };
      case 'canceled':
        return { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' };
      default:
        // requires_payment_method / requires_confirmation / requires_action:
        // a failed attempt leaves last_payment_error set; otherwise the
        // customer simply hasn't paid yet.
        return {
          paymentStatus: intent.last_payment_error ? 'FAILED' : 'UNPAID',
        };
    }
  }
}
