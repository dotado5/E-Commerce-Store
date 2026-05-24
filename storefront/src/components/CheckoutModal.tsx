"use client";

import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, Lock, Sparkles, Loader2 } from 'lucide-react';
import { useCart } from '../lib/context/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'details' | 'processing' | 'success';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cartTotal, cartItems, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('details');
  const [orderId, setOrderId] = useState('');
  
  // Form fields state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('processing');
    
    // Simulate transaction delay
    setTimeout(() => {
      const generatedId = `AE-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderId(generatedId);
      setStep('success');
      clearCart(); // Flush checkout cart items
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 animate-slide-up max-h-[95vh] flex flex-col">
        
        {/* Header (hidden in success step) */}
        {step !== 'success' && (
          <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-950 dark:text-white flex items-center gap-2">
              <Lock size={16} className="text-zinc-500" />
              Secure Checkout
            </h3>
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-50 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Step 1: Input details */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 mb-2">
                <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                  <span>Order Summary</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Shipping Information
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="jane.doe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="123 Aether Boulevard, NY"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 pt-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                  <CreditCard size={14} />
                  Payment Details (Mock)
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="4111 2222 3333 4444"
                      maxLength={19}
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        CVC
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="•••"
                        maxLength={4}
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Row */}
              <button
                type="submit"
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Authorize Payment
              </button>
            </form>
          )}

          {/* Step 2: Processing */}
          {step === 'processing' && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Loader2 size={36} className="text-zinc-500 dark:text-zinc-400 animate-spin" />
              <h4 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                Authorizing Transaction...
              </h4>
              <p className="mt-1.5 text-xs text-zinc-500 max-w-[240px]">
                Please do not close this modal or refresh. Your payment is being verified securely.
              </p>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6 px-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 animate-bounce-short">
                <CheckCircle size={36} />
              </div>
              <h3 className="mt-6 text-xl font-extrabold text-zinc-950 dark:text-white flex items-center gap-1.5 justify-center">
                <Sparkles size={18} className="text-amber-500" />
                Order Placed Successfully!
              </h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-[320px]">
                Thank you for your order, <strong>{name}</strong>. A confirmation email has been dispatched to <strong>{email}</strong>.
              </p>

              {/* Order Box card */}
              <div className="mt-6 w-full rounded-2xl bg-zinc-50 p-4 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="font-bold text-zinc-950 dark:text-white font-mono">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Delivery Address</span>
                  <span className="font-semibold text-zinc-950 dark:text-white truncate max-w-[200px]">{address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Estimated Delivery</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">2-3 Business Days</span>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
              >
                Back to Shop
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
