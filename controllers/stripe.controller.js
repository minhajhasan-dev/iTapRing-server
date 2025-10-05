/**
 * Stripe Controller
 * Handles Stripe checkout, webhooks, and payment processing
 */

import Stripe from "stripe";
import { sendOrderConfirmationEmail } from "../services/email.service.js";
import { getOrderBySessionId, saveOrder } from "../services/order.service.js";
import { validateCart } from "../services/product.service.js";
import { generateOrderId } from "../utils/helpers.js";

let stripe;
const getStripe = () => {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

/**
 * Create Stripe Checkout Session
 * Validates cart and creates secure payment session
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const { items, customerEmail, successUrl, cancelUrl } = req.body;

    console.log(
      `🛒 Checkout request: ${items.length} items for ${
        customerEmail || "guest"
      }`
    );

    // Validate cart against Stripe (server never trusts client prices)
    let validatedCart;
    try {
      validatedCart = await validateCart(items);
    } catch (validationError) {
      console.error(`❌ Validation failed: ${validationError.message}`);

      // Determine error type
      const isPriceMismatch =
        validationError.message.includes("Price mismatch");
      const isInvalidProduct =
        validationError.message.includes("Invalid product") ||
        validationError.message.includes("not found");

      return res.status(400).json({
        success: false,
        message: isPriceMismatch
          ? "Price mismatch detected. Please refresh and try again."
          : isInvalidProduct
          ? "One or more products are no longer available."
          : "Validation failed",
        error: validationError.message,
        code: isPriceMismatch
          ? "PRICE_MISMATCH"
          : isInvalidProduct
          ? "INVALID_PRODUCT"
          : "VALIDATION_ERROR",
      });
    }

    console.log(`✅ Cart validated: $${validatedCart.totalAmount}`);

    // Create line items using server-validated prices only
    const lineItems = validatedCart.items.map((item, index) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.size
            ? `${item.productName} - Size ${item.size}`
            : item.productName,
          description: item.size
            ? `${item.color} - Size ${item.size}`
            : item.color,
          images: item.productImages || [],
          metadata: {
            item_index: (index + 1).toString(),
            product_id: item.productId,
            stripe_product_id: item.stripeProductId,
            size: item.size?.toString() || "N/A",
            color: item.color,
            verified_at: item.metadata.verifiedAt,
          },
        },
        unit_amount: Math.round(item.validatedPrice * 100),
      },
      quantity: item.quantity,
    }));

    const metadata = {
      orderType: "itapring_product",
      itemCount: validatedCart.itemCount.toString(),
      totalQuantity: validatedCart.items
        .reduce((sum, item) => sum + item.quantity, 0)
        .toString(),
      validatedAmount: validatedCart.totalAmount.toFixed(2),
      validatedAt: validatedCart.validatedAt,
      itemsSummary: validatedCart.items
        .map((item, i) => {
          const size = item.size ? ` Size: ${item.size}` : "";
          return `[${i + 1}] ${item.productName} (${item.color})${size} x${
            item.quantity
          }`;
        })
        .join(" | "),
      ...validatedCart.items.reduce((acc, item, i) => {
        const num = i + 1;
        return {
          ...acc,
          [`item${num}_id`]: item.productId,
          [`item${num}_name`]: item.productName,
          [`item${num}_color`]: item.color,
          [`item${num}_size`]: item.size?.toString() || "N/A",
          [`item${num}_quantity`]: item.quantity.toString(),
          [`item${num}_price`]: item.validatedPrice.toFixed(2),
          [`item${num}_verified_at`]: item.verifiedAt,
        };
      }, {}),
    };

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      shipping_address_collection: {
        allowed_countries: process.env.ALLOWED_SHIPPING_COUNTRIES?.split(
          ","
        ) || ["US", "CA", "GB", "AU"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: 0, currency: "usd" },
            display_name: "Free Shipping",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 5 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata: {
          integration: "itapring_checkout",
          validated_at: validatedCart.validatedAt,
        },
      },
      billing_address_collection: "required",
      allow_promotion_codes: true,
    });

    console.log(
      `✅ Checkout session created: ${session.id} - $${validatedCart.totalAmount}`
    );

    res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      validatedAmount: validatedCart.totalAmount,
    });
  } catch (error) {
    console.error(`❌ Checkout error: ${error.message}`);
    next(error);
  }
};

export const verifyCheckoutSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer", "payment_intent", "shipping_cost"],
    });

    if (session.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment not completed",
        paymentStatus: session.payment_status,
      });
    }

    const existingOrder = await getOrderBySessionId(sessionId);
    if (existingOrder) {
      return res.status(200).json({
        success: true,
        ...existingOrder,
      });
    }

    const orderId = await generateOrderId();

    const orderData = {
      orderId,
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent?.id || null,
      customerEmail: session.customer_details.email,
      customerName: session.customer_details.name,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: session.payment_status,
      shippingAddress: session.shipping_details?.address
        ? {
            name: session.shipping_details.name,
            line1: session.shipping_details.address.line1,
            line2: session.shipping_details.address.line2 || null,
            city: session.shipping_details.address.city,
            state: session.shipping_details.address.state,
            postal_code: session.shipping_details.address.postal_code,
            country: session.shipping_details.address.country,
          }
        : null,
      items: session.line_items.data.map((item, index) => {
        const itemNum = index + 1;
        const productId = session.metadata?.[`item${itemNum}_id`] || "unknown";
        const productName =
          session.metadata?.[`item${itemNum}_name`] || item.description;
        const color = session.metadata?.[`item${itemNum}_color`] || "Unknown";
        const sizeValue = session.metadata?.[`item${itemNum}_size`];
        const size =
          sizeValue && sizeValue !== "N/A" ? parseInt(sizeValue, 10) : null;

        return {
          productId,
          name: productName,
          color,
          size,
          quantity: item.quantity,
          price: item.amount_total / 100,
        };
      }),
      metadata: session.metadata,
      createdAt: new Date(session.created * 1000),
    };

    try {
      await saveOrder(orderData);
      console.log("Order saved:", orderId);
    } catch (dbError) {
      console.warn("Database save failed:", dbError.message);
    }

    try {
      await sendOrderConfirmationEmail(orderData);
    } catch (emailError) {
      console.error("Email error:", emailError.message);
    }

    res.status(200).json({
      success: true,
      ...orderData,
    });
  } catch (error) {
    console.error("Session verification error:", error.message);
    next(error);
  }
};

/**
 * Handle Stripe Webhooks
 * Processes Stripe events for order fulfillment and price updates
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
    return res.status(500).json({
      success: false,
      message: "Webhook configuration error",
    });
  }

  if (!sig) {
    return res.status(400).json({
      success: false,
      message: "Missing signature",
    });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).json({
      success: false,
      message: "Invalid signature",
    });
  }

  console.log(`🔔 Webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await fulfillOrder(session);
        break;
      }

      case "payment_intent.succeeded": {
        console.log(`✅ Payment succeeded: ${event.data.object.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        console.error(`❌ Payment failed: ${event.data.object.id}`);
        break;
      }

      case "product.created":
      case "product.updated": {
        const product = event.data.object;
        console.log(
          `📦 Product ${
            event.type === "product.created" ? "created" : "updated"
          }: ${product.name} (${product.id})`
        );
        // Note: Prices will be fetched fresh on next request
        console.log("✅ Product event received");
        break;
      }

      case "price.created":
      case "price.updated": {
        const price = event.data.object;
        console.log(
          `💰 Price ${
            event.type === "price.created" ? "created" : "updated"
          }: $${(price.unit_amount / 100).toFixed(
            2
          )} ${price.currency.toUpperCase()} (${price.id})`
        );
        // Note: Prices will be fetched fresh on next request
        console.log("✅ Price event received");
        break;
      }

      default:
        console.log(`ℹ️  Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("❌ Webhook handler error:", error.message);
    res.status(500).json({ error: "Webhook handler failed" });
  }
};

async function fulfillOrder(session) {
  try {
    const existingOrder = await getOrderBySessionId(session.id);
    if (existingOrder) {
      console.log("Order already fulfilled:", existingOrder.orderId);
      return;
    }

    const fullSession = await getStripe().checkout.sessions.retrieve(
      session.id,
      {
        expand: ["line_items", "shipping_cost"],
      }
    );

    const orderId = await generateOrderId();

    const orderData = {
      orderId,
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      customerEmail: session.customer_details.email,
      customerName: session.customer_details.name,
      amount: session.amount_total / 100,
      currency: session.currency,
      paymentStatus: session.payment_status,
      shippingAddress: session.shipping_details?.address
        ? {
            name: session.shipping_details.name,
            line1: session.shipping_details.address.line1,
            line2: session.shipping_details.address.line2 || null,
            city: session.shipping_details.address.city,
            state: session.shipping_details.address.state,
            postal_code: session.shipping_details.address.postal_code,
            country: session.shipping_details.address.country,
          }
        : null,
      items: fullSession.line_items.data.map((item, index) => {
        const itemNum = index + 1;
        const productId = session.metadata?.[`item${itemNum}_id`] || "unknown";
        const productName =
          session.metadata?.[`item${itemNum}_name`] || item.description;
        const color = session.metadata?.[`item${itemNum}_color`] || "Unknown";
        const sizeValue = session.metadata?.[`item${itemNum}_size`];
        const size =
          sizeValue && sizeValue !== "N/A" ? parseInt(sizeValue, 10) : null;

        return {
          productId,
          name: productName,
          color,
          size,
          quantity: item.quantity,
          price: item.amount_total / 100,
        };
      }),
      metadata: session.metadata,
      createdAt: new Date(session.created * 1000),
    };

    await saveOrder(orderData);
    console.log("Order saved:", orderId);

    try {
      await sendOrderConfirmationEmail(orderData);
    } catch (emailError) {
      console.error("Email error:", emailError.message);
    }

    console.log("Order fulfilled:", orderId);
  } catch (error) {
    console.error("Order fulfillment error:", error.message);
    throw error;
  }
}
