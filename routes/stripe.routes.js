/**
 * Stripe Routes
 * All Stripe-related API endpoints
 */

import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
  verifyCheckoutSession,
} from "../controllers/stripe.controller.js";
import {
  paymentRateLimiter,
  webhookRateLimiter,
} from "../middleware/rateLimiter.js";
import {
  validateCheckoutSession,
  validateSessionId,
} from "../middleware/validation.js";

const router = express.Router();

/**
 * POST /api/stripe/create-checkout-session
 * Creates a new Stripe Checkout session
 * SECURITY: Rate limited to 20 requests per 15 minutes
 */
router.post(
  "/create-checkout-session",
  paymentRateLimiter,
  validateCheckoutSession,
  createCheckoutSession
);

/**
 * GET /api/stripe/verify-session/:sessionId
 * Verifies a checkout session and returns order details
 * SECURITY: Validates session ID format
 */
router.get(
  "/verify-session/:sessionId",
  validateSessionId,
  verifyCheckoutSession
);

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * SECURITY: Rate limited, requires valid Stripe signature
 * Note: This route needs raw body for signature verification
 */
router.post(
  "/webhook",
  webhookRateLimiter,
  express.raw({ type: "application/json" }),
  handleWebhook
);

export { router as stripeRouter };
