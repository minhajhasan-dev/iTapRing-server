/**
 * ==========================================
 * RATE LIMITER - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Prevent people from spamming our API
 * 
 * WHAT IS RATE LIMITING:
 * - If someone makes too many requests, block them temporarily
 * - Prevents DDoS attacks (hackers flooding the server)
 * - Prevents bots from abusing the API
 * 
 * HOW IT WORKS:
 * - Track how many requests each IP address makes
 * - If they make too many in 15 minutes, block them
 * - After 15 minutes, they can try again
 * 
 * FOR JUNIOR DEVELOPERS:
 * - This protects our server from getting overwhelmed
 * - Without this, someone could crash our server
 * - Think of it like "max 3 attempts" on a password
 */

import rateLimit from "express-rate-limit";

/**
 * Simple rate limiter for all API endpoints
 * 
 * LIMITS:
 * - 100 requests per 15 minutes per IP address
 * - That's about 6-7 requests per minute
 * 
 * WHEN IT BLOCKS:
 * - Returns error message: "Too many requests, please try again later"
 * - Status code: 429 (Too Many Requests)
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes (in milliseconds)
  max: 100, // Max 100 requests per window
  
  // Error message when limit exceeded
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  
  // Send rate limit info in response headers
  standardHeaders: true, // Include RateLimit-* headers
  legacyHeaders: false, // Don't use old X-RateLimit-* headers
  
  // Skip rate limiting for health check endpoint
  skip: (req) => {
    return req.path === "/health";
  },
});
