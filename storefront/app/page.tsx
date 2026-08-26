"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '../src/components/Navbar';
import { ProductCard } from '../src/components/ProductCard';
import { ProductDetail } from '../src/components/ProductDetail';
import { CartDrawer } from '../src/components/CartDrawer';
import { CheckoutModal } from '../src/components/CheckoutModal';
import { CATEGORIES, Product } from '../src/lib/data/products';
import { fetchProducts } from '../src/lib/api';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, Star, HelpCircle } from 'lucide-react';

export default function Home() {
  // State definitions
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load the catalog from the backend API
  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch((err: Error) =>
        setLoadError(`Could not load products: ${err.message}`),
      );
  }, []);

  // Client-side filtering and sorting logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.tagline.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    // 2. Category Tab filter
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 3. Sorting Dropdown filter
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } // 'featured' keeps original database order

    return result;
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div>
        {/* Sticky Header Navbar */}
        <Navbar
          onCartToggle={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Curator Welcome Banner Hero */}
        <header className="relative overflow-hidden bg-zinc-950 text-white py-16 sm:py-24 transition-all duration-500">
          {/* Ambient visual overlay effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/40 via-zinc-950 to-zinc-950" />
          <div className="absolute -left-1/4 -top-1/2 h-[300px] w-[300px] rounded-full bg-zinc-800/10 blur-3xl" />
          
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-800/60 border border-zinc-700/50 px-3.5 py-1 text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Aether Curator Spring Collection
              </span>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Design-Forward Living Essentials
              </h1>
              <p className="mt-4 text-base sm:text-lg text-zinc-400 max-w-lg leading-relaxed">
                Elevate your daily environment with sustainably sourced walnut organizers, high-fidelity acoustic gear, and modern smart tools.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-md p-6 max-w-xs shadow-xl text-left self-stretch sm:self-center">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-zinc-300 italic mt-1 leading-relaxed">
                "Beautiful craftsmanship and premium packaging. The Aether headphones are incredibly refined."
              </p>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                — Marcus K., Architect
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Navigation Tabs & Sorting Controls */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-zinc-200/50 pb-6 dark:border-zinc-850 gap-4">
            
            {/* Category tabs */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`rounded-full px-5 py-2 text-sm font-bold tracking-wide transition-all ${
                    selectedCategory === category.id
                      ? 'bg-zinc-950 text-white shadow-md dark:bg-white dark:text-zinc-950'
                      : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Grid sorting elements */}
            <div className="flex items-center gap-4 self-end lg:self-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                <ArrowUpDown size={14} />
                <span>Sort By</span>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-800 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:focus:border-zinc-400"
              >
                <option value="featured">Featured Essentials</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated Reviewers</option>
              </select>
            </div>

          </div>
        </section>

        {/* Main Grid Catalog Section */}
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-20">
          {filteredProducts.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
              <HelpCircle size={32} className="text-zinc-400 mb-4" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {loadError ? 'Something went wrong' : 'No items found'}
              </h3>
              <p className="mt-1.5 text-xs text-zinc-500 max-w-xs">
                {loadError ||
                  'Your search query or category filter returned no results. Try modifying your filters or search terms.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-zinc-950 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 transition-all"
              >
                <RefreshCw size={12} />
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer Design */}
      <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-500 dark:border-zinc-850 dark:bg-zinc-950 dark:text-zinc-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>© 2026 AETHER Living Inc. All rights reserved. Crafted for visual excellence.</p>
        </div>
      </footer>

      {/* Floating Dialog Popups */}
      <ProductDetail
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
