"use client";

import React from 'react';
import { Plus, Star, ShoppingCart } from 'lucide-react';
import { Product } from '../lib/data/products';
import { useCart } from '../lib/context/CartContext';
import Image from 'next/image';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening detail modal
    addToCart(product, 1);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/60 bg-white shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-md cursor-pointer dark:border-zinc-800/80 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
    >
      {/* Product Image Panel */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority={product.id <= 2}
        />
        
        {/* Category Pill Tag */}
        <span className="absolute top-4 left-4 z-10 rounded-full bg-white/80 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-800 shadow-sm dark:bg-zinc-950/80 dark:text-zinc-200">
          {product.category}
        </span>

        {/* Rating overlay */}
        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded-full bg-white/80 backdrop-blur-md px-2 py-0.5 text-xs font-semibold text-zinc-800 shadow-sm dark:bg-zinc-950/80 dark:text-zinc-200">
          <Star size={12} className="fill-amber-400 text-amber-400" />
          <span>{product.rating.toFixed(1)}</span>
        </div>

        {/* Floating Quick Add */}
        <button
          onClick={handleQuickAdd}
          disabled={product.stock === 0}
          className="absolute bottom-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-300 dark:bg-white dark:text-zinc-950 dark:disabled:bg-zinc-700"
          aria-label="Quick add to cart"
        >
          {product.stock === 0 ? (
            <span className="text-[10px] font-bold">OUT</span>
          ) : (
            <Plus size={20} />
          )}
        </button>
      </div>

      {/* Info Content Panel */}
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs text-zinc-400 dark:text-zinc-500 mb-1 font-medium">
          {product.tagline}
        </span>
        <h3 className="text-base font-semibold leading-tight text-zinc-900 group-hover:text-zinc-950 dark:text-zinc-100 dark:group-hover:text-white line-clamp-1">
          {product.name}
        </h3>
        
        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
            ${product.price.toFixed(2)}
          </span>
          <span className={`text-[10px] font-semibold ${product.stock <= 8 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {product.stock === 0 ? 'Out of stock' : product.stock <= 8 ? `${product.stock} items left` : 'In stock'}
          </span>
        </div>
      </div>
    </div>
  );
};
