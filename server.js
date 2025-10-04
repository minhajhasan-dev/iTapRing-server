/**
 * iTapRing Backend Server
 */

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
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
import { productRouter } from "./routes/product.routes.js";
import { stripeRouter } from "./routes/stripe.routes.js";
import { initializePriceCache } from "./services/product.service.js";

dotenv.config();

const requiredEnvVars = ["STRIPE_SECRET_KEY", "CLIENT_URL"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(securityHeaders);
app.use(requestTimeout(30000));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  })
);

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(securityLogger);
app.use("/api", rateLimiter);
app.use(sanitizeBody);
app.use(sanitizeQuery);
app.use(sanitizeParams);

app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "iTapRing Backend Server",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/stripe", stripeRouter);
app.use("/api/products", productRouter);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

app.use(errorHandler);

app.listen(PORT, "127.0.0.1", async () => {
  console.log(`\niTapRing Server running on http://127.0.0.1:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`CORS enabled for: ${process.env.CLIENT_URL}\n`);

  await initializePriceCache();
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

export default app;
