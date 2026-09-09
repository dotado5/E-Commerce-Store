"use client";

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, Lock, Sparkles, Loader2, LogIn, AlertCircle } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useCart } from '../lib/context/CartContext';
import {
  ApiOrder,
  checkout,
  fetchStripePk,
  getToken,
  getUserEmail,
  refreshPayment,
  signIn,
} from '../lib/api';

// The publishable key comes from the backend at runtime
// (GET /payments/config), so nothing is baked into this bundle.
let stripePromise: Promise<Stripe | null> | null = null;
async function getStripe(): Promise<Stripe | null> {
  const pk = await fetchStripePk();
  if (!pk) return null;
  stripePromise ??= loadStripe(pk);
  return stripePromise;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CheckoutStep = 'auth' | 'placing' | 'pay' | 'finalizing' | 'success';

const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-900 transition-all focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:focus:border-zinc-400';

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ isOpen, onClose }) => {
  const { cartTotal, cartItems, clearCart } = useCart();
  const [step, setStep] = useState<CheckoutStep>('auth');
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [stripeClient, setStripeClient] = useState<Stripe | null>(null);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kick off the flow each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setOrder(null);
    if (getToken()) {
      void placeOrder();
    } else {
      setStep('auth');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  async function placeOrder() {
    setStep('placing');
    setError('');
    try {
      const created = await checkout(
        cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      );
      setOrder(created);

      const stripe = created.payment?.clientSecret ? await getStripe() : null;
      if (created.payment?.clientSecret && stripe) {
        setStripeClient(stripe);
        setStep('pay');
      } else {
        // Payments disabled server-side — order stands as unpaid.
        clearCart();
        setStep('success');
      }
    } catch (err) {
      setError((err as Error).message);
      setStep('auth'); // stable screen with a retry button
    }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await signIn(email, password);
      await placeOrder();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handlePaid() {
    setStep('finalizing');
    try {
      if (order) {
        const updated = await refreshPayment(order.id);
        setOrder(updated);
      }
    } catch {
      // The webhook will still reconcile the status server-side.
    }
    clearCart();
    setStep('success');
  }

  const signedIn = Boolean(getToken());

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
            {step !== 'placing' && step !== 'finalizing' && (
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

          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Sign in (or retry after an error) */}
          {step === 'auth' && (
            <form onSubmit={signedIn ? (e) => { e.preventDefault(); void placeOrder(); } : handleSignIn} className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 mb-2">
                <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                  <span>Order Summary</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>

              {signedIn ? (
                <>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Signed in as <strong>{getUserEmail()}</strong>.
                  </p>
                  <button
                    type="submit"
                    className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  >
                    Continue to Payment
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <LogIn size={14} />
                      Sign in to your account
                    </h4>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="alice@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
                  >
                    Sign In &amp; Continue
                  </button>
                </>
              )}
            </form>
          )}

          {/* Step 2: Creating the order */}
          {(step === 'placing' || step === 'finalizing') && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Loader2 size={36} className="text-zinc-500 dark:text-zinc-400 animate-spin" />
              <h4 className="mt-4 text-base font-bold text-zinc-900 dark:text-white">
                {step === 'placing' ? 'Placing your order...' : 'Confirming payment...'}
              </h4>
              <p className="mt-1.5 text-xs text-zinc-500 max-w-[240px]">
                Please do not close this modal or refresh.
              </p>
            </div>
          )}

          {/* Step 3: Stripe payment */}
          {step === 'pay' && order?.payment?.clientSecret && stripeClient && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900">
                <div className="flex justify-between text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                  <span>Order #{order.id}</span>
                  <span>${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
              <Elements
                stripe={stripeClient}
                options={{ clientSecret: order.payment.clientSecret }}
              >
                <StripePaymentForm onPaid={handlePaid} onError={setError} />
              </Elements>
              <p className="text-center text-[10px] text-zinc-400 dark:text-zinc-600">
                Test mode — use card 4242 4242 4242 4242 with any future expiry and CVC.
              </p>
            </div>
          )}

          {/* Step 4: Success */}
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
                Thank you for your order. A confirmation email has been dispatched to{' '}
                <strong>{getUserEmail()}</strong>.
              </p>

              {/* Order Box card */}
              <div className="mt-6 w-full rounded-2xl bg-zinc-50 p-4 border border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 text-sm space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Order ID</span>
                  <span className="font-bold text-zinc-950 dark:text-white font-mono">
                    #{order?.id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total</span>
                  <span className="font-semibold text-zinc-950 dark:text-white">
                    ${Number(order?.total ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Payment</span>
                  <span
                    className={`font-bold ${
                      order?.paymentStatus === 'PAID'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {order?.paymentStatus ?? 'UNPAID'}
                  </span>
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

/** Inner form — must be rendered inside <Elements> to use the hooks. */
const StripePaymentForm: React.FC<{
  onPaid: () => void;
  onError: (msg: string) => void;
}> = ({ onPaid, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    onError('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      // Card payments complete without a redirect; only wallet/bank
      // methods that require one will leave the page.
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message ?? 'Payment failed');
      setSubmitting(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onPaid();
    } else {
      onError(`Payment is ${paymentIntent?.status ?? 'incomplete'} — try again.`);
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-zinc-950 text-sm font-bold text-white shadow-lg transition-all hover:bg-zinc-900 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Pay Now'}
      </button>
    </form>
  );
};
