/**
 * DigiLocal Business & Catalog Category Definitions
 * Centralized single source of truth for:
 * 1. Vendor Registration
 * 2. Add Product / Merchant Item Catalog
 * 3. Add Service / Service Provider Catalog
 */

export const PRODUCT_CATEGORIES = [
  'Grocery & Supermarket',
  'Fruits & Vegetables',
  'Dairy & Sweets',
  'Bakery & Snacks',
  'General Store',
  'Pharmacy & Healthcare',
  'Electronics & Repairs',
  'Hardware & Utilities',
  'Resin Art & Handicrafts',
  'Other Goods & Products',
] as const;

export const SERVICE_CATEGORIES = [
  'Electrician & Repairs',
  'AC & Appliance Service',
  'Plumbing & Sanitary Works',
  'Housekeeping & Deep Cleaning',
  'Laundry & Dry Cleaning',
  'Tuition & Coaching',
  'Doctor / Clinic & Healthcare',
  'CA, Tax & Accounting',
  'Carpentry & Interior',
  'Beauty, Salon & Spa',
  'Driver & Vehicle Services',
  'Event Services & Catering',
  'Other Home Services',
] as const;

export const PRESET_CATEGORIES = [
  ...PRODUCT_CATEGORIES,
  '+ Custom Category',
];

export const PRESET_SERVICE_CATEGORIES = [
  ...SERVICE_CATEGORIES,
  '+ Custom Category',
];

export const BUSINESS_CATEGORIES = PRODUCT_CATEGORIES;
