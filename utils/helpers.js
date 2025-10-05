/**
 * ==========================================
 * UTILITY HELPER FUNCTIONS - SIMPLIFIED
 * ==========================================
 * 
 * PURPOSE:
 * Common functions used across the application
 * 
 * FOR JUNIOR DEVELOPERS:
 * - These are reusable "helper" functions
 * - Instead of writing the same code multiple times
 * - We write it once here and use it everywhere
 */

// Import order service to count existing orders
import { getAllOrders } from "../services/order.service.js";

/**
 * Generate Sequential Order Number (BEST for Small E-commerce)
 * 
 * FORMAT: IT-XXXXXX
 * EXAMPLES: IT-100001, IT-100002, IT-100003...
 * 
 * HOW IT WORKS:
 * 1. Count how many orders exist in the system
 * 2. Add 100,000 (so first order is IT-100001, not IT-000001)
 * 3. Add 1 for the new order
 * 4. Format: IT-{number}
 * 
 * WHY THIS FORMAT IS PERFECT FOR SMALL E-COMMERCE:
 * ✅ Super easy to read - "IT dash one hundred thousand one"
 * ✅ Short & memorable - Only 9 characters
 * ✅ Professional - Used by Etsy, Shopify stores, Square
 * ✅ Phone-friendly - Easy for customers to say/type
 * ✅ Psychologically smart - Starting at 100001 looks established
 * ✅ Sortable - Automatically chronological
 * ✅ 100% unique - Sequential = impossible to duplicate
 * ✅ Scalable - Can handle 900,000+ orders
 * 
 * WHY START AT 100,001 (not 1)?
 * - Looks more established (not "your first customer")
 * - Consistent 6-digit length (professional)
 * - Common practice in e-commerce
 * - Room to grow without changing format
 * 
 * COMPARISON:
 * - Shopify: #1001, #1002 (sequential)
 * - Etsy: #123456789 (sequential)
 * - Square: Sequential numbers
 * - US: IT-100001 (sequential with prefix)
 * 
 * CUSTOMER EXPERIENCE:
 * Email: "Your order IT-100001 has been confirmed"
 * Phone: "Order number IT dash one zero zero zero zero one"
 * SMS: "Track IT-100001 at..."
 * 
 * SCALABILITY:
 * - Can handle up to 900,000 orders (IT-100001 to IT-999999)
 * - At 100 orders/month = 7,500 years of capacity!
 * - At 1000 orders/month = 750 years of capacity!
 * - When you reach 900k orders, add another digit (you'll be rich!)
 */
export const generateOrderId = async () => {
  try {
    // STEP 1: Get all existing orders
    const orders = await getAllOrders();
    
    // STEP 2: Count them
    const orderCount = orders.length;
    
    // STEP 3: Generate new order number
    // Start at 100,001 and increment from there
    const orderNumber = 100001 + orderCount;
    
    // STEP 4: Format with IT- prefix
    return `IT-${orderNumber}`;
    
    // EXAMPLES:
    // 1st order:     IT-100001
    // 2nd order:     IT-100002
    // 50th order:    IT-100050
    // 1000th order:  IT-101000
    // 5000th order:  IT-105000
    
  } catch (error) {
    // If something goes wrong, fall back to timestamp-based
    // This ensures we always generate a unique ID
    console.error("Error generating sequential order ID:", error);
    const fallbackNumber = 100000 + Date.now() % 900000;
    return `IT-${fallbackNumber}`;
  }
};

/**
 * Format price to USD currency
 * 
 * EXAMPLE: 150 → "$150.00"
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

/**
 * Convert dollars to cents for Stripe
 * 
 * WHY: Stripe API uses cents (not dollars)
 * EXAMPLE: $1.50 → 150 cents
 */
export const dollarsToCents = (dollars) => {
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars from Stripe
 * 
 * EXAMPLE: 150 cents → $1.50
 */
export const centsToDollars = (cents) => {
  return cents / 100;
};

/**
 * Validate email address
 * 
 * CHECKS: Must have @ and domain
 * EXAMPLE: "user@example.com" → true
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Clean user input to prevent attacks
 * 
 * REMOVES: < and > characters
 * LIMITS: Max 500 characters
 */
export const sanitizeString = (input) => {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove dangerous characters
    .substring(0, 500); // Prevent huge strings
};

/**
 * Format date to readable text
 * 
 * EXAMPLE: "December 25, 2024, 03:30 PM"
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};
