/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

import rateLimit from "express-rate-limit";

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === "/health";
  },
});

/**
 * Strict rate limiter for payment endpoints
 * 20 requests per 15 minutes per IP
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: "Too many payment requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook rate limiter
 * More generous for Stripe webhooks
 */
export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit to 100 webhook calls per minute
  message: {
    success: false,
    message: "Webhook rate limit exceeded.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Product read rate limiter
 * Very generous for price polling and product browsing
 * Frontend polls every 30 seconds = 120 requests/hour = safe
 */
export const productRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Limit to 200 requests per minute (generous for polling + user browsing)
  message: {
    success: false,
    message: "Too many product requests, please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for product refresh endpoint (it's manual)
    return req.path.includes("/refresh");
  },
});
