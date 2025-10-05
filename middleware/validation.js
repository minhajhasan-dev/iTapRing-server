/**
 * ==========================================
 * REQUEST VALIDATION - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Check if the data sent from frontend is valid
 * 
 * WHY IT'S NEEDED:
 * - Users might send wrong data format
 * - Hackers might send malicious data
 * - We need to validate before processing
 * 
 * WHAT IT CHECKS:
 * - Required fields are present
 * - Email addresses are valid
 * - Numbers are actually numbers
 * - Data types are correct
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Always validate user input!
 * - Never trust data from the browser
 * - Think of it like checking homework before grading
 */

/**
 * Validate checkout request
 * 
 * CHECKS:
 * - Cart has items
 * - Each item has required fields (id, name, price, quantity, size)
 * - Customer email is valid
 * - URLs are provided
 */
export const validateCheckoutSession = (req, res, next) => {
  const { items, customerEmail, successUrl, cancelUrl } = req.body;

  // Check if cart items exist
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty",
    });
  }

  // Check each item in the cart
  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Check required fields
    if (!item.id) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Missing product ID`,
      });
    }

    if (!item.name) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Missing product name`,
      });
    }

    if (!item.price || typeof item.price !== 'number' || item.price <= 0) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Invalid price`,
      });
    }

    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
      return res.status(400).json({
        success: false,
        message: `Item ${i + 1}: Invalid quantity`,
      });
    }

    // Size must be a number (6-12) or null (for bracelets)
    if (item.size !== null && item.size !== undefined) {
      if (typeof item.size !== 'number' || item.size < 6 || item.size > 12) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: Invalid size (must be 6-12 or null)`,
        });
      }
    }
  }

  // Check customer email
  if (!customerEmail || !customerEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      message: "Invalid email address",
    });
  }

  // Check URLs
  if (!successUrl || !cancelUrl) {
    return res.status(400).json({
      success: false,
      message: "Missing redirect URLs",
    });
  }

  // All checks passed!
  next();
};

/**
 * Validate session ID
 * 
 * CHECKS:
 * - Session ID starts with "cs_" (Stripe session format)
 */
export const validateSessionId = (req, res, next) => {
  const { sessionId } = req.params;

  // Check if session ID is valid Stripe format
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return res.status(400).json({
      success: false,
      message: "Invalid session ID format",
    });
  }

  // Valid!
  next();
};
