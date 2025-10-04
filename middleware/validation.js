/**
 * Request Validation Middleware
 * Validates incoming requests using Joi
 */

import Joi from "joi";

/**
 * Validate Checkout Session Request
 */
export const validateCheckoutSession = (req, res, next) => {
  const schema = Joi.object({
    items: Joi.array()
      .items(
        Joi.object({
          id: Joi.string().required(),
          name: Joi.string().required(),
          description: Joi.string().optional().allow(""),
          price: Joi.number().positive().required(),
          quantity: Joi.number().integer().positive().required(),
          size: Joi.alternatives()
            .try(
              Joi.number().integer().min(6).max(12), // Ring sizes 6-12
              Joi.allow(null) // Bracelet (no size)
            )
            .required(),
          color: Joi.string().optional().allow(""),
          colorName: Joi.string().optional().allow(""),
          category: Joi.string().optional().allow(""),
          model: Joi.any().optional(),
          metadata: Joi.object().optional(),
        }).unknown(true) // Allow additional properties
      )
      .min(1)
      .required(),
    customerEmail: Joi.string().email().required(),
    successUrl: Joi.string().required(), // Changed from .uri() to accept any string
    cancelUrl: Joi.string().required(), // Changed from .uri() to accept any string
  });

  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: false, // Keep all properties
  });

  if (error) {
    const errors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));

    console.error("❌ Validation failed:", JSON.stringify(errors, null, 2));
    console.error("📦 Received data:", JSON.stringify(req.body, null, 2));

    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors,
    });
  }

  // Replace request body with validated data
  req.body = value;
  next();
};

/**
 * Validate Session ID Parameter
 */
export const validateSessionId = (req, res, next) => {
  const schema = Joi.object({
    sessionId: Joi.string().pattern(/^cs_/).required(),
  });

  const { error } = schema.validate(req.params);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid session ID format",
    });
  }

  next();
};
