/**
 * Email Service
 * Professional email handling for order confirmations using Hostinger SMTP
 * Sends emails to both customers and business owner
 */

import { createTransport } from "nodemailer";
import { generateCustomerConfirmationHTML } from "../templates/email/customer-confirmation.html.js";
import { generateOwnerNotificationHTML } from "../templates/email/owner-notification.html.js";
import {
  generateOwnerPlainText,
  generatePlainTextConfirmation,
} from "../templates/email/plain-text.js";

// Email configuration validation
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.OWNER_EMAIL
  );
};

/**
 * Create reusable transporter for Hostinger SMTP
 * Hostinger SMTP Settings:
 * - Host: smtp.hostinger.com
 * - Port: 465 (SSL) or 587 (TLS)
 * - Secure: true for port 465, false for port 587
 */
const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error("Email configuration incomplete. Check .env file.");
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465; // Use SSL for port 465, TLS for 587

  return createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: "TLSv1.2",
    },
  });
};

/**
 * Send order confirmation email to customer
 * @param {Object} orderData - Complete order data
 * @returns {Promise<void>}
 */
export const sendOrderConfirmationEmail = async (orderData) => {
  console.log("📧 Sending order confirmation emails...");

  try {
    // Check email configuration
    if (!isEmailConfigured()) {
      console.log("⚠️  Email service not configured");
      return;
    }

    const transporter = createTransporter();

    // Verify connection
    await transporter.verify();

    const customerHtml = generateCustomerConfirmationHTML(orderData);
    const fromName = process.env.BUSINESS_NAME || "iTapRing";

    // Send email to customer
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderId}`,
      html: customerHtml,
      text: generatePlainTextConfirmation(orderData),
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
        "X-Order-ID": orderData.orderId,
        "X-Customer-Email": orderData.customerEmail,
        "X-Mailer": "iTapRing Order System",
      },
    });

    console.log("✅ Customer email sent:", orderData.customerEmail);

    // Send notification to owner
    await sendOwnerNotification(orderData, transporter);
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    // Don't throw - email failure shouldn't break order processing
  }
};

/**
 * Send order notification to business owner
 * @param {Object} orderData - Complete order data
 * @param {Object} transporter - Nodemailer transporter (reuse connection)
 * @returns {Promise<void>}
 */
const sendOwnerNotification = async (orderData, transporter) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL;

    if (!ownerEmail) {
      console.log("⚠️  Owner email not configured");
      return;
    }

    const ownerHtml = generateOwnerNotificationHTML(orderData);
    const fromName = process.env.BUSINESS_NAME || "iTapRing";

    await transporter.sendMail({
      from: `"${fromName} Orders" <${process.env.SMTP_USER}>`,
      to: ownerEmail,
      subject: `New Order ${orderData.orderId} - $${orderData.amount.toFixed(
        2
      )}`,
      html: ownerHtml,
      text: generateOwnerPlainText(orderData),
      priority: "high",
      headers: {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        Importance: "high",
        "X-Order-ID": orderData.orderId,
        "X-Order-Amount": orderData.amount.toString(),
        "X-Mailer": "iTapRing Order System",
      },
    });

    console.log("✅ Owner email sent:", ownerEmail);
  } catch (error) {
    console.error("❌ Owner email failed:", error.message);
    // Don't throw - this is a secondary notification
  }
};

/**
 * Send shipping notification to customer
 * @param {Object} orderData - Order data with tracking info
 * @returns {Promise<void>}
 */
export const sendShippingNotification = async (orderData) => {
  try {
    if (!isEmailConfigured()) {
      console.log(
        "⚠️  Email service not configured. Skipping shipping notification."
      );
      return;
    }

    const transporter = createTransporter();
    const fromName = process.env.BUSINESS_NAME || "iTapRing";

    const shippingHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Shipped - ${orderData.orderId}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
              <div style="font-size: 64px; margin-bottom: 15px;">📦</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">
                Your Order Has Shipped!
              </h1>
            </div>
            
            <div style="padding: 40px 30px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! Your order <strong>${
                  orderData.orderId
                }</strong> is on its way.
              </p>
              
              ${
                orderData.trackingNumber
                  ? `
              <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 25px 0;">
                <h3 style="color: #065f46; margin: 0 0 10px; font-size: 16px;">
                  Tracking Number
                </h3>
                <div style="font-family: 'Courier New', monospace; font-size: 18px; color: #047857; font-weight: 700;">
                  ${orderData.trackingNumber}
                </div>
                ${
                  orderData.trackingUrl
                    ? `
                <div style="margin-top: 15px;">
                  <a href="${orderData.trackingUrl}" style="color: #10b981; text-decoration: none; font-weight: 600;">
                    Track Your Package →
                  </a>
                </div>
                `
                    : ""
                }
              </div>
              `
                  : ""
              }
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Expected delivery: ${
                  orderData.estimatedDelivery || "5-7 business days"
                }
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: orderData.customerEmail,
      subject: `Order Shipped - ${orderData.orderId}`,
      html: shippingHtml,
      priority: "normal",
    });

    console.log("✅ Shipping notification sent to:", orderData.customerEmail);
  } catch (error) {
    console.error("❌ Failed to send shipping notification:", error.message);
  }
};

/**
 * Test email configuration
 * Useful for debugging SMTP settings
 * @returns {Promise<boolean>}
 */
export const testEmailConfiguration = async () => {
  try {
    if (!isEmailConfigured()) {
      console.error("❌ Email configuration incomplete");
      console.log("Required environment variables:");
      console.log("  - SMTP_HOST");
      console.log("  - SMTP_PORT");
      console.log("  - SMTP_USER");
      console.log("  - SMTP_PASS");
      console.log("  - OWNER_EMAIL");
      return false;
    }

    const transporter = createTransporter();

    // Verify connection
    await transporter.verify();

    console.log("✅ Email configuration is valid");
    console.log("📧 SMTP Host:", process.env.SMTP_HOST);
    console.log("📧 SMTP Port:", process.env.SMTP_PORT);
    console.log("📧 SMTP User:", process.env.SMTP_USER);
    console.log("📧 Owner Email:", process.env.OWNER_EMAIL);

    return true;
  } catch (error) {
    console.error("❌ Email configuration test failed:", error.message);

    if (error.code === "EAUTH") {
      console.error(
        "🔐 Authentication failed. Check your SMTP_USER and SMTP_PASS."
      );
    } else if (error.code === "ECONNECTION" || error.code === "ETIMEDOUT") {
      console.error(
        "🌐 Connection failed. Check SMTP_HOST, SMTP_PORT, and firewall settings."
      );
    }

    return false;
  }
};
