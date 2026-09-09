"use client";

import { Product } from "./data/products";

// All requests go through the Next.js rewrite proxy at /api -> backend.
const API_BASE = "/api";

const TOKEN_KEY = "aether_token";
const USER_KEY = "aether_user";

export interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: string; // Prisma Decimal serializes as string
  stock: number;
}

export interface ApiOrder {
  id: number;
  total: string;
  status: string;
  paymentIntentId: string | null;
  paymentStatus: string;
  payment?: { clientSecret: string | null } | null;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getUserEmail(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function signOut() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  authed = false,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (authed) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.message) {
        message = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

let stripePkPromise: Promise<string | null> | null = null;

/** Fetches the Stripe publishable key from the backend (cached). */
export function fetchStripePk(): Promise<string | null> {
  if (!stripePkPromise) {
    stripePkPromise = request<{ publishableKey: string | null }>(
      "/payments/config",
    )
      .then((config) => config.publishableKey)
      .catch(() => null);
  }
  return stripePkPromise;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { access_token } = await request<{ access_token: string }>(
    "/auth/signin",
    { method: "POST", body: JSON.stringify({ email, password }) },
  );
  localStorage.setItem(TOKEN_KEY, access_token);
  localStorage.setItem(USER_KEY, email);
}

const FALLBACK_IMAGES = [
  "/images/headphone.png",
  "/images/watch.png",
  "/images/organizer.png",
  "/images/lamp.png",
  "/images/bag.png",
];

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (/headphone|speaker|audio|camera/.test(n)) return "audio";
  if (/watch|jeans|shirt|beanie|windbreaker|backpack|bag/.test(n))
    return "accessories";
  if (/hub|organizer|desk|press|pillow/.test(n)) return "workspace";
  return "lifestyle";
}

/** Maps a backend product onto the richer display shape the UI expects. */
export function toDisplayProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    name: p.name,
    tagline: p.description?.split(".")[0] ?? "",
    description: p.description ?? "",
    price: Number(p.price),
    stock: p.stock,
    category: guessCategory(p.name),
    // Display-only placeholders — not stored in the backend.
    rating: 4.3 + ((p.id * 7) % 6) / 10,
    images: [FALLBACK_IMAGES[p.id % FALLBACK_IMAGES.length]],
    features: [],
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const products = await request<ApiProduct[]>("/products");
  return products.map(toDisplayProduct);
}

/**
 * Replaces the server-side cart with the locally built one, then checks
 * out. Returns the created order, including the Stripe client secret
 * when payments are enabled.
 */
export async function checkout(
  items: { productId: number; quantity: number }[],
): Promise<ApiOrder> {
  // Clear whatever is in the server cart so the order matches the UI.
  const serverCart = await request<{ items: { id: number }[] }>(
    "/cart",
    {},
    true,
  );
  for (const item of serverCart.items) {
    await request(`/cart/${item.id}`, { method: "DELETE" }, true);
  }

  for (const item of items) {
    await request("/cart", { method: "POST", body: JSON.stringify(item) }, true);
  }

  return request<ApiOrder>("/orders/checkout", { method: "POST" }, true);
}

export async function refreshPayment(orderId: number): Promise<ApiOrder> {
  return request<ApiOrder>(
    `/orders/${orderId}/refresh-payment`,
    { method: "POST" },
    true,
  );
}
