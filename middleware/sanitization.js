/**
 * ==========================================
 * INPUT SANITIZATION - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Clean user input to prevent hacking attacks
 * 
 * WHAT IS XSS (Cross-Site Scripting):
 * - Hackers try to inject JavaScript code into our website
 * - Example: User enters "<script>alert('hacked')</script>" in a form
 * - If we don't clean it, the code could run and steal data
 * 
 * HOW THIS PROTECTS US:
 * - Removes dangerous characters like < and >
 * - Limits string length (prevents memory attacks)
 * - Cleans all user input before processing
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Never trust user input!
 * - Always clean/sanitize data from forms
 * - This is like washing vegetables before cooking
 */

/**
 * Clean a single string
 * 
 * WHAT IT DOES:
 * 1. Remove < and > characters (prevents HTML injection)
 * 2. Remove extra whitespace
 * 3. Limit length to 1000 characters
 */
const sanitizeString = (str) => {
  // Only sanitize strings
  if (typeof str !== "string") return str;

  return str
    .replace(/[<>]/g, "") // Remove < and >
    .trim() // Remove spaces from start/end
    .slice(0, 1000); // Max 1000 characters
};

/**
 * Clean all strings in an object or array
 * 
 * RECURSION:
 * - This function calls itself for nested objects
 * - Example: {user: {name: "John", bio: "..."}}
 * - It will clean name AND bio
 */
const sanitizeObject = (obj) => {
  // If it's not an object, return as-is
  if (!obj || typeof obj !== "object") return obj;

  // Create empty object or array
  const sanitized = Array.isArray(obj) ? [] : {};

  // Loop through each property
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // If it's a string, clean it
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      // If it's an object, clean it recursively
      sanitized[key] = sanitizeObject(value);
    } else {
      // Numbers, booleans, etc. - keep as-is
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Middleware: Clean request body
 * This runs on every POST/PUT request
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Middleware: Clean URL query parameters
 * Example: /products?search=<script>
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Middleware: Clean URL parameters
 * Example: /products/:id where id could contain bad data
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params);
  }
  next();
};
