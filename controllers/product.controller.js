/**
 * ==========================================
 * PRODUCT CONTROLLER - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Handle API requests for product data
 * 
 * WHAT IS A CONTROLLER:
 * - Controllers handle HTTP requests
 * - They call services to do the work
 * - Then send responses back to client
 * - Think of them as "receptionists" - take requests, delegate work
 * 
 * ROUTES THIS HANDLES:
 * - GET /api/products - Get all products with prices
 * - GET /api/products/prices - Get just the prices
 * 
 * FOR JUNIOR DEVELOPERS:
 * - req = request from client (what they asked for)
 * - res = response we send back (the answer)
 * - next = pass to next middleware (usually error handler)
 */

import { getAllProducts } from "../services/product.service.js";

/**
 * Get all products with current prices from Stripe
 * 
 * WHAT IT DOES:
 * 1. Call service to fetch products from Stripe
 * 2. Send products back to client as JSON
 * 
 * ENDPOINT: GET /api/products
 * RESPONSE: { success: true, data: [...products] }
 */
export const getProducts = async (req, res, next) => {
  try {
    // Fetch products from Stripe (via service)
    const products = await getAllProducts();

    // Send success response
    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    // If error, pass to error handler middleware
    next(error);
  }
};
