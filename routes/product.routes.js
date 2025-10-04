/**
 * Product Routes
 * Endpoints for fetching validated product information
 */

import express from "express";
import {
  getProducts,
  refreshPrices,
} from "../controllers/product.controller.js";
import { productRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

/**
 * GET /api/products
 * Get all products with validated prices from Stripe
 * SECURITY: Rate limited to 60 requests per minute for price polling
 */
router.get("/", productRateLimiter, getProducts);

/**
 * POST /api/products/refresh
 * Manually refresh price cache from Stripe
 * Use after updating prices in Stripe Dashboard
 */
router.post("/refresh", refreshPrices);

export { router as productRouter };
