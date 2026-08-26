import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const products = [
  // Electronics
  {
    name: 'Wireless Bluetooth Headphones',
    description:
      'Over-ear noise-cancelling headphones with 30-hour battery life and USB-C fast charging.',
    price: '129.99',
    stock: 42,
  },
  {
    name: '4K Action Camera',
    description:
      'Waterproof 4K/60fps action camera with image stabilization and Wi-Fi transfer.',
    price: '199.99',
    stock: 18,
  },
  {
    name: 'Smart Fitness Watch',
    description:
      'Fitness tracker with heart-rate monitor, GPS, sleep tracking, and 7-day battery.',
    price: '89.99',
    stock: 55,
  },
  {
    name: 'Portable Bluetooth Speaker',
    description:
      'Compact IPX7 waterproof speaker with deep bass and 12-hour playtime.',
    price: '49.99',
    stock: 73,
  },
  {
    name: 'USB-C Charging Hub',
    description:
      '7-in-1 USB-C hub with HDMI 4K, 100W power delivery, SD card reader, and 3 USB ports.',
    price: '39.99',
    stock: 90,
  },
  // Apparel
  {
    name: 'Classic Cotton T-Shirt',
    description:
      'Soft 100% combed cotton crew-neck tee, pre-shrunk, available in classic fit.',
    price: '14.99',
    stock: 100,
  },
  {
    name: 'Slim Fit Denim Jeans',
    description:
      'Stretch denim jeans with a modern slim fit and reinforced stitching.',
    price: '59.99',
    stock: 64,
  },
  {
    name: 'Water-Resistant Windbreaker',
    description:
      'Lightweight packable windbreaker with adjustable hood and zip pockets.',
    price: '74.99',
    stock: 27,
  },
  {
    name: 'Wool Blend Beanie',
    description: 'Warm ribbed-knit beanie in a wool blend, one size fits most.',
    price: '9.99',
    stock: 85,
  },
  // Home goods
  {
    name: 'Stainless Steel French Press',
    description:
      'Double-wall insulated 1L French press with a fine mesh filter for smooth coffee.',
    price: '34.99',
    stock: 38,
  },
  {
    name: 'Memory Foam Pillow',
    description:
      'Ergonomic contour pillow with cooling gel layer and washable bamboo cover.',
    price: '44.99',
    stock: 46,
  },
  {
    name: 'Robot Vacuum Cleaner',
    description:
      'Self-charging robot vacuum with app control, mapping, and 2000Pa suction.',
    price: '299.99',
    stock: 5,
  },
];

const users = [
  { email: 'alice@example.com', name: 'Alice Johnson' },
  { email: 'bob@example.com', name: 'Bob Smith' },
  { email: 'carol@example.com', name: 'Carol Diaz' },
];

async function main() {
  // --- Users (idempotent via upsert on unique email) ---
  const passwordHash = await bcrypt.hash('password123', 10);
  const userRecords: { id: number; email: string }[] = [];
  for (const u of users) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });
    const record = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: { email: u.email, name: u.name, password: passwordHash },
    });
    userRecords.push({ id: record.id, email: record.email });
    console.log(
      `User ${u.email}: ${existing ? 'already existed (updated name)' : 'created'}`,
    );
  }

  // --- Products (no unique key on name, so check by name before creating) ---
  let productsCreated = 0;
  let productsSkipped = 0;
  for (const p of products) {
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
    });
    if (existing) {
      productsSkipped++;
      continue;
    }
    await prisma.product.create({ data: p });
    productsCreated++;
  }
  console.log(
    `Products: ${productsCreated} created, ${productsSkipped} skipped (already present)`,
  );

  // --- Cart for Alice with 2-3 items ---
  const alice = userRecords.find((u) => u.email === 'alice@example.com')!;
  const someProducts = await prisma.product.findMany({
    orderBy: { id: 'asc' },
    take: 3,
  });

  const cart = await prisma.cart.upsert({
    where: { userId: alice.id },
    update: {},
    create: { userId: alice.id },
  });

  let itemsCreated = 0;
  let itemsSkipped = 0;
  const quantities = [1, 2, 1];
  for (let i = 0; i < someProducts.length; i++) {
    const product = someProducts[i];
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: product.id },
      },
    });
    if (existingItem) {
      itemsSkipped++;
      continue;
    }
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity: quantities[i] ?? 1,
      },
    });
    itemsCreated++;
  }
  console.log(
    `Cart for alice@example.com (cart #${cart.id}): ${itemsCreated} item(s) created, ${itemsSkipped} skipped`,
  );

  // --- Summary ---
  const [finalUsers, finalProducts, finalCartItems] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.cartItem.count(),
  ]);
  console.log(
    `Done. Totals -> users: ${finalUsers}, products: ${finalProducts}, cart items: ${finalCartItems}`,
  );
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
