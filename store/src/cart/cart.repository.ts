import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Cart, CartItem } from '@prisma/client';

@Injectable()
export class CartRepository {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number) {
    return this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async createCart(userId: number) {
    return this.prisma.cart.create({
      data: { userId },
      include: { items: { include: { product: true } } },
    });
  }

  async findCartItem(cartId: number, productId: number) {
    // We need to find the item within the cart.
    // Since we don't have a direct find method for cart items by cartId and productId easily exposed without raw query or finding all,
    // we can rely on the service to filter or we can query CartItem directly if we know the structure.
    // Looking at service: const existingItem = cart.items.find((item) => item.productId === productId);
    // But better to query DB directly if possible or keep logic in service if it relies on loaded cart.
    // However, the goal is to move DB logic.
    // Let's implement a direct query for CartItem.
    return this.prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
      },
    });
  }

  async updateCartItemQuantity(id: number, quantity: number) {
    return this.prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });
  }

  async createCartItem(data: Prisma.CartItemUncheckedCreateInput) {
    return this.prisma.cartItem.create({
      data,
    });
  }

  async deleteCartItem(id: number) {
    return this.prisma.cartItem.delete({
      where: { id },
    });
  }
}
