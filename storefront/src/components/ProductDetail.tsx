"use client";

import React, { useState } from 'react';
import { X, Star, Plus, Minus, ShoppingCart, Check } from 'lucide-react';
import { Product } from '../lib/data/products';
import { useCart } from '../lib/context/CartContext';
import Image from 'next/image';

interface ProductDetailProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-slide-up max-h-[90vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-zinc-950/80 text-zinc-500 shadow-md transition-all hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-white"
          aria-label="Close details"
        >
          <X size={20} />
        </button>

        {/* Gallery Image Display */}
        <div className="relative w-full md:w-1/2 aspect-square md:aspect-auto md:h-full bg-zinc-50 dark:bg-zinc-950 min-h-[300px]">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute top-4 left-4 z-10 rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-zinc-800 shadow-sm dark:bg-zinc-950/80 dark:text-zinc-200">
            {product.category}
          </div>
        </div>

        {/* Information Panel */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto flex flex-col justify-between max-h-[50vh] md:max-h-[90vh]">
          <div>
            <span className="text-sm font-semibold tracking-wide text-zinc-400 dark:text-zinc-500 uppercase">
              {product.tagline}
            </span>
            <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-zinc-950 dark:text-white leading-tight">
              {product.name}
            </h2>

            {/* Rating */}
            <div className="mt-4 flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold ml-1">{product.rating.toFixed(1)} Rating</span>
            </div>

            {/* Price */}
            <div className="mt-6 text-3xl font-black text-zinc-950 dark:text-white">
              ${product.price.toFixed(2)}
            </div>

            {/* Description */}
            <p className="mt-6 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              {product.description}
            </p>

            {/* Highlights Checklist */}
            <div className="mt-6">
              <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                Key Features
              </h4>
              <ul className="mt-3 space-y-2">
                {product.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-700 dark:text-zinc-300">
                    <span className="mt-0.5 rounded-full bg-emerald-100 p-0.5 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">
            {product.stock > 0 ? (
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                {/* Quantity select counter */}
                <div className="flex h-12 w-32 items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-2 dark:border-zinc-800 dark:bg-zinc-950">
                  <button
                    onClick={handleDecrement}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-white hover:text-zinc-800 active:scale-95 dark:hover:bg-zinc-900 dark:hover:text-white transition-all"
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-500 hover:bg-white hover:text-zinc-800 active:scale-95 dark:hover:bg-zinc-900 dark:hover:text-white transition-all"
                    disabled={quantity >= product.stock}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Add to Cart button */}
                <button
                  onClick={handleAddToCart}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-base font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                >
                  {added ? (
                    <>
                      <Check size={18} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      Add to Cart — ${(product.price * quantity).toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 font-bold">
                Out of Stock
              </div>
            )}
            <div className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
              Only {product.stock} items left in stock.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
