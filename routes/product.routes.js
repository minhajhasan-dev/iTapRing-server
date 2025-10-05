/**
 * ==========================================
 * PRODUCT ROUTES - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Define API endpoints for product data
 * 
 * WHAT ARE ROUTES:
 * - Routes map URLs to controller functions
 * - Example: GET /api/products → calls getProducts()
 * - Think of them as a "phone directory" for your API
 * 
 * ENDPOINTS DEFINED HERE:
 * - GET /api/products - Get all products with prices
 * 
 * FOR JUNIOR DEVELOPERS:
 * - router.get() = define a GET endpoint
 * - First parameter = URL path
 * - Second parameter = function to call
 */

import express from "express";
import { getProducts } from "../controllers/product.controller.js";

const router = express.Router();

/**
 * GET /api/products
 * Get all products with current prices from Stripe
 * 
 * USAGE: 
 * fetch('http://localhost:3000/api/products')
 * 
 * RETURNS:
 * {
 *   success: true,
 *   data: [
 *     { id: 'ring-black', name: 'Black Ring', price: 150, ... }
 *   ]
 * }
 */
router.get("/", getProducts);

export { router as productRouter };
