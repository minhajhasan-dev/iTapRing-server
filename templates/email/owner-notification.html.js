/**
 * Owner Order Notification Email Template
 * Compact, professional design optimized for quick fulfillment
 * @param {Object} orderData - Order data
 * @returns {string} HTML email content
 */
export const generateOwnerNotificationHTML = (orderData) => {
  const itemsHtml = orderData.items
    .map((item) => {
      const sizeInfo = item.size ? ` (Size ${item.size})` : "";
      return `
        <tr>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb;">
            <div style="font-weight: 600; color: #111827; font-size: 13px;">${
              item.name
            }</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">${
              item.color
            }${sizeInfo} | ID: ${item.productId}</div>
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #374151;">
            ${item.quantity}
          </td>
          <td style="padding: 10px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; color: #111827;">
            $${item.price.toFixed(2)}
          </td>
        </tr>
      `;
    })
    .join("");

  const shippingHtml = orderData.shippingAddress
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
        <tr>
          <td style="padding: 14px; background-color: #f0fdf4; border-radius: 6px; border-left: 3px solid #10b981;">
            <div style="font-weight: 600; color: #065f46; font-size: 13px; margin-bottom: 6px;">Shipping Address</div>
            <div style="color: #047857; line-height: 1.5; font-size: 12px;">
              <div style="font-weight: 600;">${
                orderData.shippingAddress.name
              }</div>
              <div>${orderData.shippingAddress.line1}</div>
              ${
                orderData.shippingAddress.line2
                  ? `<div>${orderData.shippingAddress.line2}</div>`
                  : ""
              }
              <div>${orderData.shippingAddress.city}, ${
        orderData.shippingAddress.state
      } ${orderData.shippingAddress.postal_code}</div>
              <div><strong>${orderData.shippingAddress.country}</strong></div>
            </div>
          </td>
        </tr>
      </table>
    `
    : "";

  const orderDate = new Date(orderData.createdAt).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="format-detection" content="telephone=no">
        <meta name="format-detection" content="date=no">
        <meta name="format-detection" content="address=no">
        <meta name="format-detection" content="email=no">
        <title>New Order - ${orderData.orderId}</title>
        <style type="text/css">
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
              min-width: 100% !important;
            }
            .mobile-padding {
              padding-left: 10px !important;
              padding-right: 10px !important;
            }
            .mobile-text {
              font-size: 14px !important;
              line-height: 1.5 !important;
            }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);">
                
                <!-- Header -->
                <tr>
                  <td class="mobile-padding" style="background-color: #10b981; padding: 24px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">New Order Received</h1>
                    <p style="margin: 6px 0 0; color: #ffffff; font-size: 20px; font-weight: 700;">$${orderData.amount.toFixed(
                      2
                    )}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td class="mobile-padding" style="padding: 20px;">
                    
                    <!-- Order Info - Single Column -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td>
                          <div style="padding: 10px; background-color: #f0fdf4; border-radius: 4px; border-left: 3px solid #10b981; margin-bottom: 10px;">
                            <div style="font-size: 11px; color: #065f46; font-weight: 600; text-transform: uppercase; margin-bottom: 3px;">Order ID</div>
                            <div style="font-size: 13px; color: #064e3b; font-weight: 700; font-family: monospace;">${
                              orderData.orderId
                            }</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="padding: 10px; background-color: #f9fafb; border-radius: 4px;">
                            <div style="font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 3px;">Order Time</div>
                            <div style="font-size: 13px; color: #111827; font-weight: 600;">${orderDate}</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Items Table -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
                      <thead>
                        <tr style="background-color: #f9fafb;">
                          <th style="padding: 8px; text-align: left; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Product</th>
                          <th style="padding: 8px; text-align: center; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Qty</th>
                          <th style="padding: 8px; text-align: right; font-size: 11px; color: #6b7280; font-weight: 600; text-transform: uppercase;">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                      <tfoot>
                        <tr style="background-color: #f0fdf4;">
                          <td colspan="2" style="padding: 10px 8px; text-align: right; font-weight: 600; color: #065f46; border-top: 2px solid #10b981;">Total:</td>
                          <td style="padding: 10px 8px; text-align: right; font-weight: 700; color: #10b981; font-size: 16px; border-top: 2px solid #10b981;">$${orderData.amount.toFixed(
                            2
                          )}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <!-- Customer Info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
                      <tr>
                        <td style="padding: 12px; background-color: #fef3c7; border-radius: 6px; border-left: 3px solid #f59e0b;">
                          <div style="font-weight: 600; color: #78350f; font-size: 13px; margin-bottom: 6px;">Customer Information</div>
                          <div style="color: #92400e; font-size: 12px; line-height: 1.5;">
                            <div><strong>Name:</strong> ${
                              orderData.customerName || "Not provided"
                            }</div>
                            <div><strong>Email:</strong> ${
                              orderData.customerEmail
                            }</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    ${shippingHtml}
                    
                    <!-- Action Required -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px;">
                      <tr>
                        <td style="padding: 14px; background-color: #fffbeb; border-radius: 6px; border: 2px solid #f59e0b; text-align: center;">
                          <div style="font-weight: 700; color: #78350f; font-size: 14px; margin-bottom: 8px;">Action Required</div>
                          <p style="margin: 0 0 10px; color: #92400e; font-size: 12px;">Process this order within 1-2 business days.</p>
                          <a href="https://dashboard.stripe.com/payments/${
                            orderData.stripePaymentIntentId || ""
                          }" style="display: inline-block; background-color: #f59e0b; color: #ffffff; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 13px;">View in Stripe Dashboard</a>
                        </td>
                      </tr>
                    </table>
                    
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 16px 20px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
                    <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                      Automated order notification from iTapRing<br>
                      Session: ${orderData.stripeSessionId}
                    </p>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};
