"use client";

import React from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../lib/context/CartContext';
import Image from 'next/image';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onCheckout,
}) => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
  } = useCart();

  if (!isOpen) return null;

  // Shopping Calculations
  const shippingThreshold = 150;
  const shippingCost = cartTotal >= shippingThreshold || cartTotal === 0 ? 0 : 15.00;
  const estimatedTax = cartTotal * 0.08; // 8% sales tax
  const orderTotal = cartTotal + shippingCost + estimatedTax;

  const progressToFreeShipping = Math.min((cartTotal / shippingThreshold) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop backdrop-blur overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer slide-out panel */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-white shadow-2xl transition-all duration-300 ease-in-out dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 animate-slide-left">
          
          <div className="flex h-full flex-col justify-between">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 px-6 py-5 dark:border-zinc-850">
              <div className="flex items-center gap-2 text-zinc-950 dark:text-white">
                <ShoppingBag size={22} />
                <h2 className="text-lg font-bold">Shopping Cart ({cartCount})</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 mb-4">
                    <ShoppingBag size={28} />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">Your cart is empty</h3>
                  <p className="mt-2 text-xs text-zinc-500 max-w-[200px]">
                    Explore our curated collection to add premium elements.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-6 rounded-xl border border-zinc-200 px-4 py-2 text-xs font-bold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900 transition-all"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <>
                  {/* Free shipping banner */}
                  <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900/50">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {cartTotal >= shippingThreshold
                          ? '🎉 You have unlocked Free Shipping!'
                          : `Spend $${(shippingThreshold - cartTotal).toFixed(2)} more for Free Shipping`}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-950 dark:bg-white transition-all duration-500 ease-out"
                        style={{ width: `${progressToFreeShipping}%` }}
                      />
                    </div>
                  </div>

                  {/* Cart Item rows */}
                  <div className="space-y-4 divide-y divide-zinc-100 dark:divide-zinc-900">
                    {cartItems.map((item, idx) => (
                      <div key={item.product.id} className={`flex items-start gap-4 ${idx > 0 ? 'pt-4' : ''}`}>
                        {/* Thumbnail image */}
                        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900">
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Item Info and Controls */}
                        <div className="flex flex-1 flex-col justify-between self-stretch">
                          <div>
                            <div className="flex justify-between gap-1">
                              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white line-clamp-1">
                                {item.product.name}
                              </h4>
                              <span className="text-sm font-bold text-zinc-950 dark:text-white">
                                ${(item.product.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                              ${item.product.price.toFixed(2)} each
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {/* Counter buttons */}
                            <div className="flex h-8 w-24 items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-1 dark:border-zinc-800 dark:bg-zinc-900">
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg text-zinc-500 hover:bg-white hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
                              >
                                <Plus size={12} />
                              </button>
                            </div>

                            {/* Delete button */}
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Sticky Summary & Checkout Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-zinc-150 px-6 py-6 bg-zinc-50/50 dark:border-zinc-850 dark:bg-zinc-900/10">
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Shipping</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">
                      {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Tax (8%)</span>
                    <span className="font-semibold text-zinc-950 dark:text-white">${estimatedTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-3 text-base font-bold text-zinc-950 dark:text-white">
                    <span>Total</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};
