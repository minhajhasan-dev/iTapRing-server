/**
 * Plain Text Email Templates
 * Fallback versions for email clients that don't support HTML
 */

/**
 * Generate plain text version of customer confirmation
 * @param {Object} orderData - Order data
 * @returns {string} Plain text email content
 */
export const generatePlainTextConfirmation = (orderData) => {
  const items = orderData.items
    .map((item) => {
      const sizeInfo = item.size ? ` - Size ${item.size}` : "";
      return `  - ${item.name} (${item.color}${sizeInfo}) x${
        item.quantity
      } - $${item.price.toFixed(2)}`;
    })
    .join("\n");

  const shipping = orderData.shippingAddress
    ? `
Shipping Address:
${orderData.shippingAddress.name}
${orderData.shippingAddress.line1}
${orderData.shippingAddress.line2 || ""}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${
        orderData.shippingAddress.postal_code
      }
${orderData.shippingAddress.country}
`
    : "";

  return `
ORDER CONFIRMATION

Hi ${orderData.customerName || "there"},

Thank you for your order! Your payment has been confirmed and we're preparing your items for shipment.

Order Number: ${orderData.orderId}
Order Date: ${new Date(orderData.createdAt).toLocaleDateString("en-US")}

ITEMS ORDERED:
${items}

Subtotal: $${orderData.amount.toFixed(2)}
Shipping: FREE
-----------------------------------
Total: $${orderData.amount.toFixed(2)}
${shipping}

WHAT'S NEXT?
We're preparing your order for shipment. You'll receive tracking information within 1-2 business days.

Questions? Contact us at ${process.env.OWNER_EMAIL || "support@itapring.com"}

Thank you for choosing ${process.env.BUSINESS_NAME || "iTapRing"}!

---
© ${new Date().getFullYear()} ${
    process.env.BUSINESS_NAME || "iTapRing"
  }. All rights reserved.
This email was sent to ${orderData.customerEmail}
  `.trim();
};

/**
 * Generate plain text version of owner notification
 * @param {Object} orderData - Order data
 * @returns {string} Plain text email content
 */
export const generateOwnerPlainText = (orderData) => {
  const items = orderData.items
    .map((item) => {
      const sizeInfo = item.size ? ` - Size ${item.size}` : "";
      return `  - ${item.name} (${item.color}${sizeInfo}) x${
        item.quantity
      } - $${item.price.toFixed(2)}
    Product ID: ${item.productId}`;
    })
    .join("\n");

  const shipping = orderData.shippingAddress
    ? `
SHIPPING ADDRESS:
${orderData.shippingAddress.name}
${orderData.shippingAddress.line1}
${orderData.shippingAddress.line2 || ""}
${orderData.shippingAddress.city}, ${orderData.shippingAddress.state} ${
        orderData.shippingAddress.postal_code
      }
${orderData.shippingAddress.country}
`
    : "";

  return `
NEW ORDER RECEIVED - $${orderData.amount.toFixed(2)}

Order ID: ${orderData.orderId}
Order Time: ${new Date(orderData.createdAt).toLocaleString("en-US")}

CUSTOMER INFORMATION:
Name: ${orderData.customerName || "Not provided"}
Email: ${orderData.customerEmail}

ITEMS ORDERED:
${items}

TOTAL: $${orderData.amount.toFixed(2)}
${shipping}

PAYMENT DETAILS:
Payment ID: ${orderData.stripePaymentIntentId || "N/A"}
Session ID: ${orderData.stripeSessionId}

ACTION REQUIRED:
Please process this order and prepare for shipment within 1-2 business days.

View in Stripe Dashboard:
https://dashboard.stripe.com/payments/${orderData.stripePaymentIntentId || ""}

---
Automated notification from iTapRing Store
Email sent at ${new Date().toLocaleString("en-US")}
  `.trim();
};
