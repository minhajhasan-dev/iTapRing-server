/**
 * Security Middleware
 */

export const securityLogger = (req, res, next) => {
  if (req.path.includes("/stripe") || req.path.includes("/payment")) {
    const ip = req.ip || req.connection.remoteAddress;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} from ${ip}`
    );
  }
  next();
};

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
};

export const requestTimeout = (timeout = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeout);
    res.setTimeout(timeout);
    next();
  };
};
