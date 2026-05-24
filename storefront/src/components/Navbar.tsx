"use client";

import React from 'react';
import { ShoppingBag, Search, Sparkles } from 'lucide-react';
import { useCart } from '../lib/context/CartContext';

interface NavbarProps {
  onCartToggle: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onCartToggle,
  searchQuery,
  setSearchQuery,
}) => {
  const { cartCount } = useCart();

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-200/50 bg-white/80 backdrop-blur-md transition-colors duration-300 dark:border-zinc-800/50 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white shadow-md dark:from-white dark:to-zinc-300 dark:text-black">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-900 bg-clip-text text-xl font-bold tracking-wider text-transparent dark:from-white dark:via-zinc-200 dark:to-zinc-400">
              AETHER
            </span>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search size={18} className="text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search premium essentials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-zinc-200 bg-zinc-50/50 py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-300 dark:focus:bg-zinc-950"
            />
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCartToggle}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
              aria-label="Toggle cart"
            >
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 animate-bounce-short items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-950">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search bar */}
        <div className="relative pb-3 md:hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pb-3">
            <Search size={16} className="text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search essentials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 pl-9 pr-4 text-xs text-zinc-900 placeholder-zinc-400 transition-all focus:border-zinc-500 focus:bg-white focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:border-zinc-300 dark:focus:bg-zinc-950"
          />
        </div>
      </div>
    </nav>
  );
};
