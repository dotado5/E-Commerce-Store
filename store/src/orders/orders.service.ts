import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersRepository, CheckoutItem } from './orders.repository';
import { CartRepository } from '../cart/cart.repository';
import { MailService } from '../mail/mail.service';
import { RedisService } from '../redis/redis.service';
import { StripeService } from '../payments/stripe.service';
import { PaymentsService } from '../payments/payments.service';
import { productKey, productsListKey } from '../redis/cache-keys';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private ordersRepository: OrdersRepository,
    private cartRepository: CartRepository,
    private mailService: MailService,
    private redis: RedisService,
    private stripeService: StripeService,
    private paymentsService: PaymentsService,
  ) {}

  async checkout(userId: number) {
    const cart = await this.cartRepository.getCart(userId);

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const items: CheckoutItem[] = cart.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.product.price,
    }));

    const total = items.reduce(
      (sum, item) => sum.add(item.price.mul(item.quantity)),
      new Prisma.Decimal(0),
    );

    const order = await this.ordersRepository.createOrderFromCart(
      userId,
      cart.id,
      items,
      total,
    );

    // Stock changed, so cached product data is stale.
    await this.redis.del(
      productsListKey(),
      ...items.map((item) => productKey(item.productId)),
    );

    // Fire and forget — a mail failure must not fail the checkout.
    this.mailService
      .sendOrderConfirmation(order.user, order)
      .catch((err: Error) =>
        this.logger.error(
          `Failed to send confirmation email for order #${order.id}: ${err.message}`,
        ),
      );

    // Create a Stripe payment intent for the order. The client_secret is
    // what the frontend needs to collect payment via Stripe Elements.
    let payment: { clientSecret: string | null } | null = null;
    if (this.stripeService.isEnabled()) {
      try {
        const intent = await this.stripeService.createPaymentIntent(
          order.id,
          total,
          order.user.email,
        );
        if (intent) {
          await this.ordersRepository.setPaymentIntent(order.id, intent.id);
          order.paymentIntentId = intent.id;
          order.paymentStatus = 'PROCESSING';
          payment = { clientSecret: intent.client_secret };
        }
      } catch (err) {
        // The order itself stands; payment can be reconciled later.
        this.logger.error(
          `Failed to create payment intent for order #${order.id}: ${(err as Error).message}`,
        );
      }
    }

    return { ...order, payment };
  }

  /**
   * Pulls the current payment intent state from Stripe and syncs it onto
   * the order — useful in development when webhooks aren't forwarded.
   */
  async refreshPayment(userId: number, id: number) {
    const order = await this.findOne(userId, id);

    if (order.paymentIntentId) {
      const intent = await this.stripeService.retrievePaymentIntent(
        order.paymentIntentId,
      );
      if (intent) {
        await this.paymentsService.applyIntentUpdate(intent);
      }
    }

    return this.findOne(userId, id);
  }

  async findAll(userId: number) {
    return this.ordersRepository.findAllByUser(userId);
  }

  async findOne(userId: number, id: number) {
    const order = await this.ordersRepository.findOne(id, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}
