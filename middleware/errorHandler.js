/**
 * Global Error Handler Middleware
 * Handles all errors and sends appropriate responses
 */

export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error:", err);

  // Stripe errors
  if (err.type && err.type.startsWith("Stripe")) {
    return res.status(err.statusCode || 400).json({
      success: false,
      message: err.message,
      type: err.type,
      code: err.code,
    });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.details,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
