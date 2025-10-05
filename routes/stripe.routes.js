/**
 * ==========================================
 * STRIPE ROUTES - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Define API endpoints for Stripe payment processing
 * 
 * ENDPOINTS DEFINED HERE:
 * - POST /api/stripe/create-checkout-session - Start checkout
 * - GET /api/stripe/verify-session/:sessionId - Check order status
 * - POST /api/stripe/webhook - Receive Stripe events
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Checkout session = Stripe's payment page
 * - Webhook = Stripe calling us when something happens
 * - Session ID = unique identifier for a checkout
 */

import express from "express";
import {
  createCheckoutSession,
  handleWebhook,
  verifyCheckoutSession,
} from "../controllers/stripe.controller.js";
import {
  validateCheckoutSession,
  validateSessionId,
} from "../middleware/validation.js";

const router = express.Router();

/**
 * POST /api/stripe/create-checkout-session
 * Creates a new Stripe Checkout session
 * 
 * WHAT IT DOES:
 * 1. Validates cart items
 * 2. Creates Stripe checkout session
 * 3. Returns URL to Stripe payment page
 * 
 * REQUEST BODY:
 * {
 *   items: [...cart items],
 *   customerEmail: "customer@example.com",
 *   successUrl: "http://...",
 *   cancelUrl: "http://..."
 * }
 */
router.post(
  "/create-checkout-session",
  validateCheckoutSession,
  createCheckoutSession
);

/**
 * GET /api/stripe/verify-session/:sessionId
 * Verifies a checkout session and returns order details
 * 
 * USAGE:
 * GET /api/stripe/verify-session/cs_test_abc123
 * 
 * RETURNS:
 * Order details if session is valid
 */
router.get(
  "/verify-session/:sessionId",
  validateSessionId,
  verifyCheckoutSession
);

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events
 * 
 * WHAT IS A WEBHOOK:
 * - Stripe calls this endpoint when events happen
 * - Example: Payment completed, payment failed, etc.
 * - We verify it's really Stripe (signature check)
 * - Then process the event
 * 
 * NOTE: This route needs raw body for signature verification
 */
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);

export { router as stripeRouter };
