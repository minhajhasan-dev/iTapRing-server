/**
 * Product Controller
 * Handles product-related API endpoints
 */

import {
  getAllProducts,
  updatePriceCache,
} from "../services/product.service.js";

/**
 * Get all products with current prices from Stripe
 */
export const getProducts = async (req, res, next) => {
  try {
    const products = await getAllProducts();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Manually refresh prices from Stripe
 * Useful for immediate price updates
 */
export const refreshPrices = async (req, res, next) => {
  try {
    console.log("🔄 Manual price refresh requested");

    await updatePriceCache();
    const products = await getAllProducts();

    console.log(
      `✅ Price refresh complete - ${products.length} products updated`
    );

    res.status(200).json({
      success: true,
      message: "Price cache refreshed successfully from Stripe",
      count: products.length,
      timestamp: new Date().toISOString(),
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        currency: p.currency,
      })),
    });
  } catch (error) {
    console.error("❌ Error refreshing prices:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to refresh prices",
      error: error.message,
    });
  }
};
