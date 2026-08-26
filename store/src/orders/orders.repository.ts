import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CheckoutItem {
  productId: number;
  productName: string;
  quantity: number;
  price: Prisma.Decimal;
}

@Injectable()
export class OrdersRepository {
  constructor(private prisma: PrismaService) {}

  async createOrderFromCart(
    userId: number,
    cartId: number,
    items: CheckoutItem[],
    total: Prisma.Decimal,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Decrement stock atomically; the stock >= quantity condition makes
      // the update a no-op (count 0) when stock is insufficient.
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `Insufficient stock for product "${item.productName}"`,
          );
        }
      }

      const order = await tx.order.create({
        data: {
          userId,
          total,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
          },
        },
        include: {
          items: { include: { product: true } },
          user: { select: { email: true, name: true } },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId } });

      return order;
    });
  }

  async setPaymentIntent(orderId: number, paymentIntentId: string) {
    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentIntentId, paymentStatus: 'PROCESSING' },
    });
  }

  async findAllByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.order.findFirst({
      where: { id, userId },
      include: { items: { include: { product: true } } },
    });
  }
}
