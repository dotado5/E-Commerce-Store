import type { NextRequest } from "next/server";

// Server-side proxy: forwards /api/* to the backend. Unlike a next.config
// rewrite (baked into the build), this reads API_URL at request time, so
// the same image works in any environment — and the backend can stay
// private (Stripe webhooks arrive via /api/payments/webhook too).
const API_URL = () => process.env.API_URL ?? "http://localhost:3000";

const FORWARDED_HEADERS = ["content-type", "authorization", "stripe-signature"];

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const target = `${API_URL()}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const res = await fetch(target, {
    method: req.method,
    headers,
    // Raw bytes, not parsed JSON — Stripe webhook signatures depend on
    // the body arriving byte-for-byte unchanged.
    body: hasBody ? await req.arrayBuffer() : undefined,
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export {
  proxy as GET,
  proxy as POST,
  proxy as PUT,
  proxy as PATCH,
  proxy as DELETE,
};
