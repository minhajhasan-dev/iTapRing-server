/**
 * ==========================================
 * PRODUCT SERVICE - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * This file handles all product and price operations with Stripe.
 * It fetches product information and validates prices to prevent fraud.
 * 
 * WHY IT EXISTS:
 * - We need to get product prices from Stripe (payment provider)
 * - We need to make sure the frontend isn't lying about prices
 * - Security: Never trust prices sent from the browser!
 * 
 * WHAT IT DOES:
 * 1. Connects to Stripe API
 * 2. Fetches product information and prices
 * 3. Validates that cart prices match Stripe prices
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Stripe is our payment processor (like PayPal)
 * - We always check prices on the server, not the browser
 * - This prevents customers from changing prices in browser
 */

import Stripe from "stripe";

// ==========================================
// STRIPE CONNECTION
// ==========================================

/**
 * Create a connection to Stripe API
 * We create it only once and reuse it (more efficient)
 */
let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    // Get API key from environment variable (secret!)
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// ==========================================
// PRODUCT ID MAPPING
// ==========================================

/**
 * Map our product IDs to Stripe product IDs
 * 
 * WHY: Our frontend uses simple IDs like "ring-black"
 *      Stripe uses complex IDs like "prod_123abc"
 *      This maps between them
 * 
 * IMPORTANT: These must match the IDs in frontend's products.data.js
 */
const getProductIdMap = () => ({
  "ring-black": process.env.STRIPE_PRODUCT_RING_BLACK,
  "ring-white": process.env.STRIPE_PRODUCT_RING_WHITE,
  "bracelet-cf-marble": process.env.STRIPE_PRODUCT_CF_MARBLE,
  "bracelet-cf-volcano": process.env.STRIPE_PRODUCT_CF_VOLCANO,
  "bracelet-gold-marble": process.env.STRIPE_PRODUCT_GOLD_MARBLE,
  "bracelet-gold-volcano": process.env.STRIPE_PRODUCT_GOLD_VOLCANO,
});

// ==========================================
// FETCH PRODUCTS FROM STRIPE
// ==========================================

/**
 * Get all products and prices from Stripe
 * 
 * WHAT THIS DOES:
 * 1. Asks Stripe for all active products
 * 2. Gets the price for each product
 * 3. Returns the information in a simple format
 * 
 * WHY IT'S NEEDED:
 * - Prices might change in Stripe dashboard
 * - We want to show current prices to customers
 * - We use this to validate cart prices
 */
export const fetchStripeProducts = async () => {
  try {
    const stripe = getStripe();

    // Ask Stripe for all active products
    // expand: ["data.default_price"] means "also give us price info"
    const products = await stripe.products.list({
      limit: 100, // Max products to fetch
      active: true, // Only active products (not archived)
      expand: ["data.default_price"], // Include price details
    });

    // Store products in a Map for easy lookup
    const productMap = new Map();

    // Loop through each product
    for (const product of products.data) {
      let price = null;

      // Get the product's price
      if (product.default_price) {
        // If price is already included (expanded), use it
        if (typeof product.default_price === "object") {
          price = product.default_price;
        } else {
          // If it's just an ID, fetch the full price details
          price = await stripe.prices.retrieve(product.default_price);
        }
      }

      // Only add products that have an active price
      if (price && price.active) {
        productMap.set(product.id, {
          id: product.id,
          name: product.name,
          description: product.description || product.name,
          images: product.images || [],
          price: price.unit_amount / 100, // Convert cents to dollars
          priceId: price.id,
          currency: price.currency,
          metadata: product.metadata || {},
        });

        console.log(`✓ ${product.name}: $${price.unit_amount / 100}`);
      }
    }

    return productMap;
  } catch (error) {
    console.error("❌ Error fetching Stripe products:", error.message);
    throw error;
  }
};

// ==========================================
// GET ALL PRODUCTS (FOR FRONTEND)
// ==========================================

/**
 * Get all products with their prices
 * This is called by the frontend to display products
 * 
 * RETURNS: Array of products with prices
 */
export const getAllProducts = async () => {
  try {
    // Fetch fresh products from Stripe
    const stripeProducts = await fetchStripeProducts();

    const products = [];
    const PRODUCT_ID_MAP = getProductIdMap();

    // Convert Stripe products to our format
    for (const [frontendId, stripeProductId] of Object.entries(PRODUCT_ID_MAP)) {
      if (!stripeProductId) continue;

      const stripeProduct = stripeProducts.get(stripeProductId);
      if (stripeProduct) {
        products.push({
          id: frontendId, // Our simple ID (e.g., 'ring-black')
          stripeProductId: stripeProduct.id, // Stripe's ID
          stripePriceId: stripeProduct.priceId, // Stripe's price ID
          name: stripeProduct.name,
          description: stripeProduct.description,
          price: stripeProduct.price,
          currency: stripeProduct.currency,
          metadata: stripeProduct.metadata,
        });
      }
    }

    return products;
  } catch (error) {
    console.error("❌ Error getting products:", error.message);
    throw error;
  }
};

// ==========================================
// VALIDATE PRODUCT PRICE (SECURITY!)
// ==========================================

/**
 * Check if the price the customer sent matches Stripe's price
 * 
 * WHY THIS IS CRITICAL:
 * - Customers can hack the browser and change prices
 * - We NEVER trust prices from the frontend
 * - Always verify against Stripe before charging
 * 
 * EXAMPLE:
 * - Frontend says: "This ring costs $5"
 * - We check Stripe: "No, it costs $150"
 * - We reject the order! (prevent fraud)
 * 
 * PARAMETERS:
 * - productId: Our product ID (e.g., "ring-black")
 * - claimedPrice: The price frontend sent
 * - quantity: How many they want
 * - size: Ring size (if applicable)
 */
export const validateProductPrice = async (productId, claimedPrice, quantity = 1, size = null) => {
  try {
    const PRODUCT_ID_MAP = getProductIdMap();
    const stripeProductId = PRODUCT_ID_MAP[productId];

    // Check if this is a valid product
    if (!stripeProductId) {
      throw new Error(`Invalid product: ${productId}`);
    }

    console.log(`🔒 Validating ${productId} - checking Stripe...`);

    const stripe = getStripe();

    // Step 1: Get product from Stripe
    const stripeProduct = await stripe.products.retrieve(stripeProductId);

    // Step 2: Check if product has a price
    if (!stripeProduct.default_price) {
      throw new Error(`No price found for product: ${productId}`);
    }

    // Step 3: Get the price details
    const stripePrice = await stripe.prices.retrieve(stripeProduct.default_price);

    // Step 4: Check if price is active
    if (!stripePrice || !stripePrice.active) {
      throw new Error(`Price not active for product: ${productId}`);
    }

    // Step 5: Convert Stripe price from cents to dollars
    const actualPrice = stripePrice.unit_amount / 100;

    // Step 6: Compare prices (allow 1 cent difference for rounding)
    const priceDifference = Math.abs(actualPrice - claimedPrice);

    if (priceDifference > 0.01) {
      // FRAUD DETECTED!
      console.error(`❌ PRICE FRAUD DETECTED!`);
      console.error(`   Product: ${productId}`);
      console.error(`   Customer sent: $${claimedPrice}`);
      console.error(`   Actual price: $${actualPrice}`);
      throw new Error(`Price mismatch: Expected $${actualPrice}, got $${claimedPrice}`);
    }

    console.log(`✅ Price verified: ${productId} @ $${actualPrice} x${quantity}`);

    // Return validated product info
    return {
      valid: true,
      productId,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
      validatedPrice: actualPrice,
      totalPrice: actualPrice * quantity,
      productName: stripeProduct.name,
      productDescription: stripeProduct.description || stripeProduct.name,
      productImages: stripeProduct.images || [],
      quantity,
      size,
      verifiedAt: new Date().toISOString(),
    };

  } catch (error) {
    console.error(`❌ Validation failed for ${productId}:`, error.message);
    throw error;
  }
};

// ==========================================
// VALIDATE ENTIRE SHOPPING CART
// ==========================================

/**
 * Validate all items in the shopping cart
 * 
 * WHY: 
 * - Check every single item before charging customer
 * - Make sure all prices are correct
 * - Calculate total amount
 * 
 * WHAT IT DOES:
 * 1. Loop through each cart item
 * 2. Validate the price with Stripe
 * 3. Add up the total
 * 4. Return validated cart or throw error
 */
export const validateCart = async (cartItems) => {
  console.log(`🔒 Validating ${cartItems.length} cart item(s)...`);

  // Basic checks
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Cart is empty");
  }
  if (cartItems.length > 50) {
    throw new Error("Cart too large (max 50 items)");
  }

  const validatedItems = [];
  let totalAmount = 0;
  const errors = [];

  // Loop through each item
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    console.log(`   [${i + 1}/${cartItems.length}] Checking: ${item.name || item.id}`);

    // Check if item has required fields
    if (!item.id || !item.price || !item.quantity) {
      errors.push(`Item ${i + 1} is missing required fields`);
      continue;
    }

    // Check quantity is valid
    if (item.quantity < 1 || item.quantity > 100) {
      errors.push(`Item ${item.id}: Invalid quantity (${item.quantity})`);
      continue;
    }

    try {
      // Validate this item's price with Stripe
      const validated = await validateProductPrice(
        item.id,
        item.price,
        item.quantity,
        item.size
      );

      // Add to validated list
      validatedItems.push({
        ...validated,
        color: item.colorName || item.color || "Standard",
        metadata: {
          frontendProductId: item.id,
          color: item.colorName || item.color,
          size: item.size,
          category: item.category,
          verifiedAt: validated.verifiedAt,
        },
      });

      totalAmount += validated.totalPrice;
      console.log(`   ✅ $${validated.validatedPrice} x${validated.quantity} = $${validated.totalPrice}`);

    } catch (error) {
      errors.push(`${item.id}: ${error.message}`);
      console.error(`   ❌ ${error.message}`);
    }
  }

  // If any errors, reject the entire cart
  if (errors.length > 0) {
    throw new Error(`Cart validation failed: ${errors.join("; ")}`);
  }

  console.log(`✅ Cart valid: ${validatedItems.length} items, $${totalAmount.toFixed(2)}`);

  return {
    valid: true,
    items: validatedItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    itemCount: validatedItems.length,
    validatedAt: new Date().toISOString(),
  };
};


