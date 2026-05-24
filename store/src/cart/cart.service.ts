import { Injectable, NotFoundException } from '@nestjs/common';
import { CartRepository } from './cart.repository';

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  async getCart(userId: number) {
    let cart = await this.cartRepository.getCart(userId);

    if (!cart) {
      cart = await this.cartRepository.createCart(userId);
    }

    return cart;
  }

  async addToCart(userId: number, productId: number, quantity: number) {
    const cart = await this.getCart(userId);

    // Optimization: Use repository to find item directly if possible, or use the loaded cart.
    // Since we already loaded the cart with items in getCart, we can check there first.
    // However, for consistency with the repository pattern and potentially cleaner logic:
    const existingItem = cart.items.find(
      (item) => item.productId === productId,
    );

    if (existingItem) {
      return this.cartRepository.updateCartItemQuantity(
        existingItem.id,
        existingItem.quantity + quantity,
      );
    } else {
      return this.cartRepository.createCartItem({
        cartId: cart.id,
        productId,
        quantity,
      });
    }
  }

  async removeFromCart(userId: number, cartItemId: number) {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    return this.cartRepository.deleteCartItem(cartItemId);
  }
}
