/**
 * Simplified Product Service with Secure Validation
 */

import Stripe from "stripe";

// Lazy-load Stripe to ensure env vars are loaded
let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// In-memory cache for product prices - DISABLED for real-time pricing
let priceCache = new Map();
let lastCacheUpdate = null;
const CACHE_TTL = 0; // 0 seconds - NO CACHING, always fetch fresh from Stripe

/**
 * Force immediate cache invalidation
 * Called by webhooks when prices change in Stripe
 */
export const invalidateCache = () => {
  console.log("🔄 Cache invalidated - will refresh on next request");
  lastCacheUpdate = null; // Force refresh on next request
};

/**
 * Product ID Mapping - Frontend ID to Stripe Product ID
 * IMPORTANT: These IDs must match frontend products.data.js exactly
 */
const getProductIdMap = () => ({
  "ring-black": process.env.STRIPE_PRODUCT_RING_BLACK,
  "ring-white": process.env.STRIPE_PRODUCT_RING_WHITE,
  "bracelet-cf-marble": process.env.STRIPE_PRODUCT_CF_MARBLE,
  "bracelet-cf-volcano": process.env.STRIPE_PRODUCT_CF_VOLCANO,
  "bracelet-gold-marble": process.env.STRIPE_PRODUCT_GOLD_MARBLE,
  "bracelet-gold-volcano": process.env.STRIPE_PRODUCT_GOLD_VOLCANO,
});

/**
 * Fetch all active products and prices from Stripe
 * ALWAYS uses the product's default_price to ensure correct pricing
 * NO CACHING - Always fetches fresh from Stripe API
 */
export const fetchStripeProducts = async () => {
  try {
    const stripe = getStripe();

    // Expand default_price to get price details in one call
    const products = await stripe.products.list({
      limit: 100,
      active: true,
      expand: ["data.default_price"], // Expand to get price details
    });

    const productMap = new Map();

    for (const product of products.data) {
      // Get the default price (expanded or fetch separately)
      let price = null;

      if (product.default_price) {
        // If default_price is expanded, it's an object
        if (typeof product.default_price === "object") {
          price = product.default_price;
        } else {
          // If it's a string ID, fetch it
          price = await stripe.prices.retrieve(product.default_price);
        }
      }

      // Only add products that have an active default price
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

        console.log(
          `   ✓ ${product.name}: $${price.unit_amount / 100} (${price.id})`
        );
      } else {
        console.warn(`   ⚠️ ${product.name}: No active default price`);
      }
    }

    return productMap;
  } catch (error) {
    console.error("❌ Error fetching Stripe products:", error.message);
    throw error;
  }
};

/**
 * Update price cache from Stripe (called on startup and webhooks)
 */
export const updatePriceCache = async () => {
  try {
    priceCache = await fetchStripeProducts();
    lastCacheUpdate = Date.now();
    console.log(`✅ Price cache updated (${priceCache.size} products)`);
  } catch (error) {
    console.error("❌ Failed to update price cache:", error.message);
    throw error;
  }
};

/**
 * Get all products for frontend (with frontend IDs)
 */
export const getAllProducts = async () => {
  try {
    // Always fetch fresh prices from Stripe
    await updatePriceCache();

    const products = [];
    const PRODUCT_ID_MAP = getProductIdMap();

    for (const [frontendId, stripeProductId] of Object.entries(
      PRODUCT_ID_MAP
    )) {
      if (!stripeProductId) continue;

      const stripeProduct = priceCache.get(stripeProductId);
      if (stripeProduct) {
        products.push({
          id: frontendId, // Frontend ID (e.g., 'ring-black-001')
          stripeProductId: stripeProduct.id,
          stripePriceId: stripeProduct.priceId,
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

/**
 * Validate product price against Stripe (server never trusts client prices)
 * CRITICAL: Always fetches fresh prices directly from Stripe API for checkout validation
 * Includes retry logic to prevent timeouts
 */
export const validateProductPrice = async (
  productId,
  claimedPrice,
  quantity = 1,
  size = null,
  retries = 3
) => {
  const PRODUCT_ID_MAP = getProductIdMap();
  const stripeProductId = PRODUCT_ID_MAP[productId];

  if (!stripeProductId) {
    throw new Error(`Invalid product: ${productId}`);
  }

  // CRITICAL FOR CHECKOUT: Always fetch fresh price directly from Stripe
  console.log(
    `🔒 Validating ${productId} - fetching live price from Stripe API...`
  );

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const stripe = getStripe();

      // Set a timeout for Stripe API calls (10 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Stripe API timeout"));
        }, 10000);
      });

      // Fetch the product directly from Stripe API with timeout
      const stripeProduct = await Promise.race([
        stripe.products.retrieve(stripeProductId),
        timeoutPromise,
      ]);

      if (!stripeProduct.default_price) {
        throw new Error(`No default price found for product: ${productId}`);
      }

      // Fetch the default price
      const stripePrice = await Promise.race([
        stripe.prices.retrieve(stripeProduct.default_price),
        timeoutPromise,
      ]);

      if (!stripePrice || !stripePrice.active) {
        throw new Error(`Default price not active for product: ${productId}`);
      }
      const actualPrice = stripePrice.unit_amount / 100; // Convert cents to dollars
      const priceDifference = Math.abs(actualPrice - claimedPrice);

      // Reject if price mismatch (1 cent tolerance)
      if (priceDifference > 0.01) {
        console.error(`❌ PRICE MISMATCH DETECTED!`);
        console.error(`   Product: ${productId}`);
        console.error(`   Client sent: $${claimedPrice}`);
        console.error(`   Stripe has: $${actualPrice}`);
        console.error(`   Difference: $${priceDifference}`);
        throw new Error(
          `Price mismatch: Expected $${actualPrice}, got $${claimedPrice}`
        );
      }

      console.log(
        `✅ Price verified from Stripe: ${productId} @ $${actualPrice} x${quantity}`
      );

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
      // Check if it's a timeout or network error that we should retry
      const shouldRetry =
        attempt < retries &&
        (error.message.includes("timeout") ||
          error.message.includes("ECONNRESET") ||
          error.message.includes("ETIMEDOUT") ||
          error.message.includes("EAI_AGAIN") ||
          error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT");

      if (shouldRetry) {
        console.warn(
          `⚠️  Stripe API error (attempt ${attempt}/${retries}): ${error.message}. Retrying...`
        );
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise((resolve) =>
          setTimeout(resolve, 100 * Math.pow(2, attempt - 1))
        );
        continue;
      }

      // If it's a price mismatch or other validation error, throw immediately
      console.error(
        `❌ Stripe validation failed for ${productId}:`,
        error.message
      );
      throw error;
    }
  }

  // If all retries failed
  throw new Error(
    `Failed to validate ${productId} after ${retries} attempts. Please try again.`
  );
};

/**
 * Validate entire cart before checkout
 * CRITICAL: Validates each item against live Stripe prices
 */
export const validateCart = async (cartItems) => {
  console.log(`🔒 Validating ${cartItems.length} cart item(s)...`);

  if (!cartItems?.length) {
    throw new Error("Cart is empty");
  }
  if (cartItems.length > 50) {
    throw new Error("Cart too large (max 50 items)");
  }

  const validatedItems = [];
  let totalAmount = 0;
  let validationErrors = [];

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    console.log(
      `   [${i + 1}/${cartItems.length}] Validating: ${item.name || item.id}`
    );

    // Validate item structure
    if (!item.id || !item.price || !item.quantity) {
      const error = `Invalid cart item at position ${
        i + 1
      }: missing required fields`;
      validationErrors.push(error);
      console.error(`   ❌ ${error}`);
      continue;
    }

    if (item.quantity < 1 || item.quantity > 100) {
      const error = `Invalid quantity for ${item.id}: ${item.quantity} (must be 1-100)`;
      validationErrors.push(error);
      console.error(`   ❌ ${error}`);
      continue;
    }

    try {
      // Validate price against Stripe API (live fetch)
      const validated = await validateProductPrice(
        item.id,
        item.price,
        item.quantity,
        item.size
      );

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
      console.log(
        `   ✅ $${validated.validatedPrice} x${validated.quantity} = $${validated.totalPrice}`
      );
    } catch (error) {
      validationErrors.push(`${item.id}: ${error.message}`);
      console.error(`   ❌ ${error.message}`);
    }
  }

  // If any validation errors, reject the entire cart
  if (validationErrors.length > 0) {
    console.error(`❌ Cart validation failed: ${validationErrors.join("; ")}`);
    throw new Error(`Validation failed: ${validationErrors.join("; ")}`);
  }

  console.log(
    `✅ Cart validated: ${validatedItems.length} items, $${totalAmount.toFixed(
      2
    )}`
  );

  return {
    valid: true,
    items: validatedItems,
    totalAmount: Number(totalAmount.toFixed(2)),
    itemCount: validatedItems.length,
    validatedAt: new Date().toISOString(),
  };
};

/**
 * Initialize price cache on server startup
 */
export const initializePriceCache = async () => {
  try {
    const PRODUCT_ID_MAP = getProductIdMap();
    const configuredProducts = Object.values(PRODUCT_ID_MAP).filter(Boolean);

    if (configuredProducts.length === 0) {
      console.warn(
        "⚠️  No Stripe product IDs configured - validation disabled"
      );
      return;
    }

    await updatePriceCache();
    console.log(
      `✅ Validation enabled for ${configuredProducts.length} products`
    );
  } catch (error) {
    console.error("❌ Failed to initialize price cache:", error.message);
  }
};
