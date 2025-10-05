/**
 * ==========================================
 * ITAPRING BACKEND SERVER - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * This is the main server file that handles all backend operations
 * 
 * WHAT THIS FILE DOES:
 * - Starts the Express.js server
 * - Connects to Stripe (payment processing)
 * - Sets up security (prevents hacking)
 * - Defines API routes (endpoints)
 * - Handles errors
 * 
 * HOW EXPRESS WORKS:
 * - Express is a web framework for Node.js
 * - Think of it as a waiter taking orders (requests) and bringing food (responses)
 * - Routes are like menu items: /api/products, /api/stripe/checkout, etc.
 * 
 * MIDDLEWARE:
 * - Middleware are functions that run before your route handlers
 * - Like security checks at airport before boarding
 * - Order matters! They run top to bottom
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Start reading from app.listen() at the bottom
 * - Then read upwards to understand the setup
 * - Each app.use() adds a middleware layer
 */

import cors from "cors"; // Allow frontend to talk to backend
import dotenv from "dotenv"; // Load environment variables (.env file)
import express from "express"; // Web framework
import helmet from "helmet"; // Security headers
import morgan from "morgan"; // HTTP request logger

// Import our custom middleware
import { errorHandler } from "./middleware/errorHandler.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import {
  sanitizeBody,
  sanitizeParams,
  sanitizeQuery,
} from "./middleware/sanitization.js";
import {
  requestTimeout,
  securityHeaders,
  securityLogger,
} from "./middleware/security.js";

// Import our API routes
import { productRouter } from "./routes/product.routes.js";
import { stripeRouter } from "./routes/stripe.routes.js";

// Load environment variables from .env file
dotenv.config();

// ==========================================
// CHECK REQUIRED ENVIRONMENT VARIABLES
// ==========================================

/**
 * Make sure we have the required secrets
 * If any are missing, stop the server
 */
const requiredEnvVars = ["STRIPE_SECRET_KEY", "CLIENT_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1); // Exit with error code
  }
}

// ==========================================
// CREATE EXPRESS APP
// ==========================================

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE SETUP (Security & Utilities)
// ==========================================

/**
 * Helmet - Adds security headers
 * Protects against common web vulnerabilities
 */
app.use(helmet());

/**
 * Custom security headers
 * Additional security configuration
 */
app.use(securityHeaders);

/**
 * Request timeout - 30 seconds max
 * Prevents hanging requests that never complete
 */
app.use(requestTimeout(30000));

/**
 * CORS - Cross-Origin Resource Sharing
 * Allows frontend (different domain) to call our API
 * 
 * WHAT IS CORS:
 * - Browser security feature
 * - Blocks requests from other domains by default
 * - We explicitly allow our frontend domain
 */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Frontend URL
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"], // Allowed headers
  })
);

/**
 * Morgan - HTTP request logger
 * Logs all API requests to console
 * Helps with debugging
 */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * Security logger
 * Logs security-related events
 */
app.use(securityLogger);

/**
 * Rate limiter
 * Prevent API abuse (see rateLimiter.js)
 */
app.use("/api", rateLimiter);

/**
 * Input sanitization
 * Clean user input to prevent XSS attacks
 * Runs on all requests
 */
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(sanitizeParams);

/**
 * JSON body parser
 * Converts request body to JavaScript object
 * 
 * SPECIAL CASE:
 * - Webhook endpoint needs RAW body (not JSON)
 * - So we skip parsing for webhook route
 */
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next(); // Skip JSON parsing for webhook
  } else {
    express.json()(req, res, next); // Parse JSON for other routes
  }
});

// ==========================================
// ROUTES (API Endpoints)
// ==========================================

/**
 * Health check endpoint
 * Used to verify server is running
 * 
 * USAGE: GET http://localhost:5000/health
 * RETURNS: { status: "OK", message: "...", timestamp: "..." }
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "iTapRing Backend Server",
    timestamp: new Date().toISOString(),
  });
});

/**
 * Stripe routes
 * Handles payments, checkout, webhooks
 * 
 * ROUTES:
 * - POST /api/stripe/create-checkout-session
 * - POST /api/stripe/webhook
 * - GET /api/stripe/session/:sessionId
 */
app.use("/api/stripe", stripeRouter);

/**
 * Product routes
 * Handles product data and prices
 * 
 * ROUTES:
 * - GET /api/products
 * - GET /api/products/prices
 */
app.use("/api/products", productRouter);

/**
 * 404 handler
 * Catches requests to non-existent routes
 */
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

/**
 * Error handler
 * Catches all errors and sends proper response
 * MUST be last middleware!
 */
app.use(errorHandler);

// ==========================================
// START SERVER
// ==========================================

/**
 * Start listening for requests
 * Bind to localhost (127.0.0.1) on specified PORT
 */
app.listen(PORT, "127.0.0.1", () => {
  console.log(`\n✅ iTapRing Server running on http://127.0.0.1:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL}\n`);
});

/**
 * Graceful shutdown handlers
 * Clean up when server stops
 */
process.on("SIGTERM", () => {
  console.log("👋 Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("👋 Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

export default app;
