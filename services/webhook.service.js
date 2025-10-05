/**
 * Webhook Service
 * Handles Stripe webhook events with cache invalidation
 */

import Stripe from "stripe";
import { calculateAnalytics, saveOrder } from "./dataStore.service.js";
import { rateLimitedStripe, adminLimiter } from "./rateLimiter.service.js";

let stripe;
let adminStripe;

const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    adminStripe = rateLimitedStripe(stripe, adminLimiter);
  }
  return stripe;
};

const getAdminStripe = () => {
  getStripe();
  return adminStripe;
};

/**
 * Process checkout session completed event
 */
export const processCheckoutSessionCompleted = async (session) => {
  try {
    console.log("📦 Processing checkout session:", session.id);

    // Get order ID from metadata
    const orderId = session.metadata?.orderId;
    
    if (!orderId) {
      console.log(`⏭️  Skipping session without orderId: ${session.id.substring(0, 30)}...`);
      return null;
    }

    // Get line items from session
    const lineItems = await getStripe().checkout.sessions.listLineItems(
      session.id,
      { limit: 100 }
    );

    // Get customer details
    let customer = null;
    if (session.customer) {
      try {
        customer = await getStripe().customers.retrieve(session.customer);
      } catch (error) {
        console.error("Error fetching customer:", error);
      }
    }

    // Create order object
    const order = {
      id: orderId,
      paymentIntent: session.payment_intent,
      status: session.payment_status,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      customer: {
        id: session.customer,
        email: customer?.email || session.customer_details?.email,
        name: customer?.name || session.customer_details?.name,
        phone: session.customer_details?.phone,
      },
      shipping: session.shipping_details,
      items: lineItems.data.map((item) => ({
        product_id: item.price.product,
        name: item.description,
        description: item.description,
        quantity: item.quantity,
        price: item.price.unit_amount / 100,
        amount_total: item.amount_total / 100,
      })),
      metadata: {
        ...session.metadata,
        stripeSessionId: session.id
      },
      created: session.created,
      expires_at: session.expires_at,
    };

    // Save to local storage
    await saveOrder(order);

    // Recalculate analytics
    await calculateAnalytics();

    console.log("✅ Order saved successfully:", order.id);
    return order;
  } catch (error) {
    console.error("❌ Error processing checkout session:", error);
    throw error;
  }
};

/**
 * Process payment intent succeeded event
 */
export const processPaymentIntentSucceeded = async (paymentIntent) => {
  try {
    console.log("💳 Processing payment intent:", paymentIntent.id);

    // Find existing order with this payment intent
    const { getOrders } = await import("./dataStore.service.js");
    const orders = await getOrders();
    const existingOrder = orders.find(
      (o) => o.paymentIntent === paymentIntent.id
    );

    if (existingOrder) {
      // Update order status
      existingOrder.status = "paid";
      existingOrder.paymentStatus = paymentIntent.status;
      await saveOrder(existingOrder);
      console.log("✅ Order payment status updated:", existingOrder.id);
    }

    return paymentIntent;
  } catch (error) {
    console.error("❌ Error processing payment intent:", error);
    throw error;
  }
};

/**
 * Process customer created event
 */
export const processCustomerCreated = async (customer) => {
  try {
    console.log("👤 New customer created:", customer.id);
    // Customer will be saved when they make their first order
    return customer;
  } catch (error) {
    console.error("❌ Error processing customer:", error);
    throw error;
  }
};

/**
 * Process charge succeeded event
 */
export const processChargeSucceeded = async (charge) => {
  try {
    console.log("💰 Charge succeeded:", charge.id);
    // Charge data is already captured in checkout session
    return charge;
  } catch (error) {
    console.error("❌ Error processing charge:", error);
    throw error;
  }
};

/**
 * Sync historical orders from Stripe (one-time operation)
 */
export const syncHistoricalOrders = async (limit = 100) => {
  try {
    console.log("🔄 Syncing historical orders from Stripe...");

    const sessions = await getStripe().checkout.sessions.list({
      limit,
      expand: ["data.customer", "data.line_items"],
    });

    let synced = 0;
    let skipped = 0;
    for (const session of sessions.data) {
      if (session.payment_status === "paid") {
        const result = await processCheckoutSessionCompleted(session);
        if (result) {
          synced++;
        } else {
          skipped++;
        }
      }
    }

    await calculateAnalytics();

    console.log(`✅ Synced ${synced} historical orders (${skipped} skipped - no orderId in metadata)`);
    return { synced, skipped, total: sessions.data.length };
  } catch (error) {
    console.error("❌ Error syncing historical orders:", error);
    throw error;
  }
};
