/**
 * ==========================================
 * EMAIL SERVICE - SIMPLIFIED VERSION
 * ==========================================
 * 
 * PURPOSE:
 * Send order confirmation emails to customers and owner
 * 
 * WHAT IS SMTP:
 * - Simple Mail Transfer Protocol (how email works)
 * - Like the post office for emails
 * - We use Hostinger as our email provider
 * 
 * WHEN EMAILS ARE SENT:
 * - When customer completes order → send confirmation
 * - Also notify business owner about new order
 * 
 * FOR JUNIOR DEVELOPERS:
 * - Nodemailer is the library that sends emails
 * - SMTP settings are in .env file (keep them secret!)
 * - Email failures should NOT break the order process
 */

import { createTransport } from "nodemailer";
import { generateCustomerConfirmationHTML } from "../templates/email/customer-confirmation.html.js";
import { generateOwnerNotificationHTML } from "../templates/email/owner-notification.html.js";
import {
  generateOwnerPlainText,
  generatePlainTextConfirmation,
} from "../templates/email/plain-text.js";

/**
 * Check if email is configured
 * We need these environment variables to send emails
 */
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.OWNER_EMAIL
  );
};

/**
 * Create email transporter (connection to email server)
 * 
 * HOSTINGER SMTP SETTINGS:
 * - Host: smtp.hostinger.com
 * - Port: 465 (with SSL) or 587 (with TLS)
 * - SSL = more secure connection
 */
const createTransporter = () => {
  if (!isEmailConfigured()) {
    throw new Error("Email configuration incomplete. Check .env file.");
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = port === 465; // Use SSL for port 465

  return createTransport({
    host: process.env.SMTP_HOST, // Email server address
    port: port, // Port number
    secure: secure, // Use SSL encryption?
    auth: {
      user: process.env.SMTP_USER, // Email account username
      pass: process.env.SMTP_PASS, // Email account password
    },
  });
};

/**
 * Send order confirmation email to customer
 * 
 * WHAT IT DOES:
 * 1. Generate HTML email from template
 * 2. Send email to customer
 * 3. Also send notification to business owner
 * 
 * IMPORTANT:
 * - If email fails, we log it but DON'T break the order
 * - Order is more important than email!
 */
export const sendOrderConfirmationEmail = async (orderData) => {
  console.log("📧 Sending order confirmation emails...");

  try {
    // Check if email is set up
    if (!isEmailConfigured()) {
      console.log("⚠️  Email service not configured");
      return;
    }

    // Create email connection
    const transporter = createTransporter();

    // Test connection
    await transporter.verify();
    console.log("✅ Email server connection OK");

    // Generate email HTML
    const customerHtml = generateCustomerConfirmationHTML(orderData);
    const fromName = process.env.BUSINESS_NAME || "iTapRing";

    // Send email to customer
    await transporter.sendMail({
      from: `"${fromName}" <${process.env.SMTP_USER}>`,
      to: orderData.customerEmail,
      subject: `Order Confirmation - ${orderData.orderId}`,
      html: customerHtml,
      text: generatePlainTextConfirmation(orderData), // Plain text version
    });

    console.log("✅ Customer email sent:", orderData.customerEmail);

    // Also notify the business owner
    await sendOwnerNotification(orderData, transporter);

  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    // Don't throw - email failure shouldn't break order processing
  }
};

/**
 * Send notification to business owner
 * This alerts the owner about a new order
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
      subject: `New Order ${orderData.orderId} - $${orderData.amount.toFixed(2)}`,
      html: ownerHtml,
      text: generateOwnerPlainText(orderData),
    });

    console.log("✅ Owner email sent:", ownerEmail);
  } catch (error) {
    console.error("❌ Owner email failed:", error.message);
    // Don't throw - this is a secondary notification
  }
};

/**
 * Test email configuration
 * Useful for debugging if emails aren't working
 * 
 * WHEN TO USE:
 * - Run this when setting up the server
 * - Helps find SMTP configuration problems
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

    // Try to connect to email server
    const transporter = createTransporter();
    await transporter.verify();

    console.log("✅ Email configuration is valid");
    console.log("📧 SMTP Host:", process.env.SMTP_HOST);
    console.log("📧 SMTP User:", process.env.SMTP_USER);

    return true;
  } catch (error) {
    console.error("❌ Email test failed:", error.message);
    return false;
  }
};
