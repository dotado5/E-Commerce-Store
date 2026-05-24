export interface Product {
  id: number;
  name: string;
  tagline: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  rating: number;
  images: string[];
  features: string[];
}

export const CATEGORIES = [
  { id: 'all', name: 'All Products' },
  { id: 'audio', name: 'Premium Audio' },
  { id: 'lifestyle', name: 'Smart Lifestyle' },
  { id: 'workspace', name: 'Modern Workspace' },
  { id: 'accessories', name: 'Travel & Accessories' },
];

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Aether Sound-Canceling Headphones',
    tagline: 'Pure Sound. Absolute Quiet.',
    description: 'Immerse yourself in your favorite playlists without distractions. The Aether headphones feature studio-quality audio drivers, state-of-the-art hybrid active noise cancellation (ANC), and premium plush memory foam earcups designed for ultimate all-day comfort.',
    price: 349.00,
    stock: 12,
    category: 'audio',
    rating: 4.8,
    images: ['/images/headphone.png'],
    features: [
      'Hybrid Active Noise Cancellation (up to 40dB reduction)',
      '40mm Custom Dynamic Drivers for rich, precise sound',
      'Up to 45 hours of battery life with fast-charging support',
      'Bluetooth 5.3 with multi-point connectivity',
      'Premium matte black finish with brushed titanium accents'
    ]
  },
  {
    id: 2,
    name: 'Minimalist Chrono Watch',
    tagline: 'Timeless Design for Modern Lifespans.',
    description: 'A masterpiece of sleek horology, the Minimalist Chrono is crafted for those who value structure and clean aesthetics. Featuring a lightweight sandblasted titanium chassis, scratch-resistant sapphire crystal glass, and a breathable silver stainless steel mesh strap.',
    price: 289.00,
    stock: 8,
    category: 'accessories',
    rating: 4.6,
    images: ['/images/watch.png'],
    features: [
      'Ultra-thin 7.8mm titanium alloy casing',
      'Scratch-proof Sapphire Crystal dome lens',
      'Japanese Quartz Chronograph movement',
      'Interchangeable quick-release silver mesh strap',
      'Water resistant up to 5 ATM (50 meters)'
    ]
  },
  {
    id: 3,
    name: 'Walnut & Brass Desk Organizer',
    tagline: 'Elevate Your Productivity Hub.',
    description: 'Crafted entirely by hand, this heavy-base organizer aligns your daily essentials. Features solid dark American walnut wood paired with heavy brushed brass accents, presenting designated slots for your premium writing utensils, notes, and smartphone.',
    price: 119.00,
    stock: 25,
    category: 'workspace',
    rating: 4.9,
    images: ['/images/organizer.png'],
    features: [
      'Sustainably harvested dark American walnut solid wood',
      'Heavy brushed brass base plates for slip-free weighting',
      'Integrated soft wool felt bedding to protect items',
      'Rear hidden groove for routing charging cords clean',
      'Hand-finished with natural oils and wax protection'
    ]
  },
  {
    id: 4,
    name: 'Luna Ambient Smart Lamp',
    tagline: 'Paint Your Space with Light.',
    description: 'Bring warm, dynamic celestial illumination into your sanctuary. The Luna Smart Lamp is a beautiful glowing sphere resting on a minimalist concrete base. Control the color spectrum, animation speed, and warm amber scheduling directly via capacitive touch commands.',
    price: 159.00,
    stock: 15,
    category: 'lifestyle',
    rating: 4.7,
    images: ['/images/lamp.png'],
    features: [
      'Hand-blown frosted opal glass sphere for soft diffusion',
      'Full RGBW spectrum with custom warm-to-cool amber shades',
      'Capacitive touch metal dimmer and mode-switching controls',
      'Smart home wireless synchronization & alarm scheduling',
      'Sleek modern cast concrete base with anti-scratch bottom'
    ]
  },
  {
    id: 5,
    name: 'Aero Leather Travel Backpack',
    tagline: 'Uncompromising Utility on the Move.',
    description: 'Designed for the modern commuter and weekend traveler, the Aero Travel Backpack balances aesthetic posture with structural utility. Engineered using premium full-grain black leather combined with water-resistant 1680D ballistic nylon panels.',
    price: 245.00,
    stock: 6,
    category: 'accessories',
    rating: 4.7,
    images: ['/images/bag.png'],
    features: [
      'Combination of full-grain oil-waxed leather & 1680D nylon',
      'Dedicated padded laptop compartment (fits up to 16-inch Mac)',
      '180-degree clamshell opening for seamless packing',
      'Luggage pass-through strap for airport transit ease',
      'Ergonomic air-mesh shoulder straps with hidden passport slot'
    ]
  }
];
