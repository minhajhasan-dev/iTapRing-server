# iTapRing Backend Server

Secure backend server for iTapRing with Stripe payment processing.

## Features

- 🔒 **Secure Payment Processing** - Stripe Checkout integration
- 📧 **Email Notifications** - Order confirmations via Hostinger SMTP
- 🛡️ **Security Hardened** - Helmet, CORS, rate limiting, input sanitization
- 📝 **Request Logging** - Morgan HTTP request logger
- ⚡ **Fast & Scalable** - Express.js with optimized middleware

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Payment:** Stripe API
- **Email:** Nodemailer with SMTP
- **Security:** Helmet, CORS, express-rate-limit
- **Validation:** Joi

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Configuration (Optional)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-email-password
OWNER_EMAIL=owner@yourdomain.com
BUSINESS_NAME=iTapRing
```

### 3. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:5000`

## API Endpoints

### Health Check

```
GET /health
```

### Stripe Checkout

```
POST /api/stripe/create-checkout-session
Body: { items: [...] }
```

### Verify Payment

```
GET /api/stripe/verify-session/:sessionId
```

### Stripe Webhook

```
POST /api/stripe/webhook
Headers: stripe-signature
```

### Product Management

```
GET /api/products
GET /api/products/:id
```

## Database Schema

### Order Collection

```javascript
{
  orderId: String,              // Unique identifier
  stripeSessionId: String,      // Stripe session ID
  customerEmail: String,        // Customer email
  customerName: String,         // Customer name
  shippingAddress: Object,      // Shipping details
  items: Array,                 // Order items
  amount: Number,               // Total in cents
  currency: String,             // Currency code
  status: String,               // Order status
  paymentStatus: String,        // Payment status
  createdAt: Date,              // Creation timestamp
  updatedAt: Date               // Update timestamp
}
```

## Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Run tests (coming soon)
npm test
```

## Testing Stripe Webhooks

Install Stripe CLI:

```bash
brew install stripe/stripe-cli/stripe
```

Login and forward webhooks:

```bash
stripe login
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## Security Features

- ✅ Helmet security headers
- ✅ CORS configuration
- ✅ Rate limiting (100 requests per 15 minutes)
- ✅ Input sanitization (XSS protection)
- ✅ Request timeout protection
- ✅ Environment variable validation
- ✅ Error handling middleware
- ✅ Security event logging
- ✅ Price validation from server-side
- ✅ Webhook signature verification

## Project Structure

```
iTapRing-server/
├── config/
│   └── database.js          # MongoDB configuration
├── controllers/
│   ├── stripe.controller.js # Stripe payment logic
│   └── product.controller.js# Product management
├── middleware/
│   ├── errorHandler.js      # Global error handler
│   ├── rateLimiter.js       # Rate limiting
│   ├── sanitization.js      # Input sanitization
│   ├── security.js          # Security middleware
│   └── validation.js        # Request validation
├── models/
│   └── Order.model.js       # MongoDB Order schema
├── routes/
│   ├── stripe.routes.js     # Stripe endpoints
│   └── product.routes.js    # Product endpoints
├── services/
│   ├── email.service.js     # Email sending
│   ├── order.service.js     # Order operations
│   └── product.service.js   # Product operations
├── templates/
│   └── email/               # Email templates
├── .env                     # Environment variables
├── .env.example             # Example environment file
├── server.js                # Main application
└── package.json             # Dependencies

```

## Environment Variables

| Variable                | Required | Description                          |
| ----------------------- | -------- | ------------------------------------ |
| `PORT`                  | No       | Server port (default: 5000)          |
| `NODE_ENV`              | No       | Environment (development/production) |
| `CLIENT_URL`            | Yes      | Frontend URL for CORS                |
| `STRIPE_SECRET_KEY`     | Yes      | Stripe secret key                    |
| `STRIPE_WEBHOOK_SECRET` | Yes      | Stripe webhook secret                |
| `MONGODB_URI`           | Yes      | MongoDB connection string            |
| `SMTP_HOST`             | No       | SMTP server host                     |
| `SMTP_PORT`             | No       | SMTP server port                     |
| `SMTP_USER`             | No       | SMTP username                        |
| `SMTP_PASS`             | No       | SMTP password                        |
| `OWNER_EMAIL`           | No       | Business owner email                 |
| `BUSINESS_NAME`         | No       | Business name for emails             |

## MongoDB Setup

For detailed MongoDB setup instructions, see [MONGODB_SETUP.md](./MONGODB_SETUP.md).

Quick setup:

1. Install MongoDB or create MongoDB Atlas account
2. Set `MONGODB_URI` in `.env`
3. Server will auto-connect on startup

## Production Deployment

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (recommended)
- Stripe account with live keys
- Domain with SSL certificate

### Steps

1. **Set Production Environment Variables**

   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Deploy to hosting service:**

   - Render
   - Railway
   - Heroku
   - AWS EC2
   - DigitalOcean

3. **Configure Stripe Webhook**

   - Add production webhook endpoint in Stripe Dashboard
   - Update `STRIPE_WEBHOOK_SECRET`

4. **Monitor & Scale**
   - Use MongoDB Atlas monitoring
   - Set up logging (e.g., Winston, Logtail)
   - Configure process manager (PM2)

## Troubleshooting

### MongoDB Connection Error

```bash
# Check MongoDB is running
brew services list | grep mongodb

# Test connection
mongosh "mongodb://localhost:27017/itapring"
```

### Stripe Webhook Fails

- Verify webhook secret in `.env`
- Check Stripe CLI is forwarding
- Ensure raw body parser for webhook route

### Email Not Sending

- Verify SMTP credentials
- Check firewall/port 587 access
- Test with [mail-tester.com](https://www.mail-tester.com)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:

- Create an issue on GitHub
- Email: support@itapring.com
- Documentation: [Full MongoDB Setup Guide](./MONGODB_SETUP.md)

---

Made with ❤️ by the iTapRing Team

## 🚀 Features

- ✅ **Stripe Checkout Integration** - Hosted payment pages with full customization
- ✅ **Secure Payment Processing** - PCI-compliant payment handling
- ✅ **Webhook Handler** - Real-time payment event processing
- ✅ **Order Management** - Complete order tracking and management
- ✅ **Email Notifications** - Automated order confirmation emails
- ✅ **Rate Limiting** - Protection against abuse and DDoS
- ✅ **Input Validation** - Joi-based request validation
- ✅ **Error Handling** - Comprehensive error management
- ✅ **CORS Security** - Configured cross-origin requests
- ✅ **Environment Variables** - Secure configuration management

## 📋 Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Stripe account ([Sign up](https://dashboard.stripe.com/register))

## 🛠️ Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your Stripe keys:**

   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   CLIENT_URL=http://localhost:5173
   ```

4. **Get Stripe keys:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Copy your test secret key (starts with `sk_test_`)
   - Add it to your `.env` file

## 🏃 Running the Server

### Development Mode (with auto-reload):

```bash
npm run dev
```

### Production Mode:

```bash
npm start
```

The server will start on `http://localhost:5000`

## 🔧 Testing with Stripe

### 1. Test Cards

Use these test card numbers:

| Card Number         | Scenario                      |
| ------------------- | ----------------------------- |
| 4242 4242 4242 4242 | Success                       |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Declined (generic)            |
| 4000 0025 0000 3155 | Requires authentication       |

- **Expiry:** Any future date
- **CVC:** Any 3 digits
- **ZIP:** Any 5 digits

### 2. Testing Webhooks Locally

Install Stripe CLI:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

Login to Stripe:

```bash
stripe login
```

Forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Copy the webhook signing secret (starts with `whsec_`) and add it to `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 3. Trigger Test Webhooks

In another terminal:

```bash
stripe trigger checkout.session.completed
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

Returns server status and configuration info.

### Create Checkout Session

```http
POST /api/stripe/create-checkout-session
Content-Type: application/json

{
  "items": [
    {
      "id": "ring-black-001",
      "name": "Black NFC Ring",
      "description": "Matte Black - Premium NFC Device",
      "price": 80.00,
      "quantity": 1,
      "color": "Matte Black",
      "metadata": {
        "productId": "ring-black-001",
        "color": "Matte Black",
        "category": "ring"
      }
    }
  ],
  "customerEmail": "customer@example.com",
  "successUrl": "http://localhost:5173/order-success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:5173/checkout"
}
```

**Response:**

```json
{
  "success": true,
  "sessionId": "cs_test_abc123...",
  "url": "https://checkout.stripe.com/pay/cs_test_abc123..."
}
```

### Verify Session

```http
GET /api/stripe/verify-session/:sessionId
```

**Response:**

```json
{
  "success": true,
  "orderId": "ORD-1696205430123-ABC123",
  "amount": 95.50,
  "customerEmail": "customer@example.com",
  "paymentStatus": "paid",
  "shippingAddress": {
    "name": "John Doe",
    "line1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postal_code": "10001",
    "country": "US"
  },
  "items": [...],
  "createdAt": "2025-10-02T12:30:00.000Z"
}
```

### Webhook Handler

```http
POST /api/stripe/webhook
stripe-signature: t=...,v1=...
```

Handles Stripe webhook events:

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.succeeded`
- `charge.refunded`

## 🗂️ Project Structure

```
iTapRing-server/
├── server.js                 # Main server file
├── routes/
│   └── stripe.routes.js      # Stripe API routes
├── controllers/
│   └── stripe.controller.js  # Stripe business logic
├── middleware/
│   ├── errorHandler.js       # Error handling
│   ├── rateLimiter.js        # Rate limiting
│   └── validation.js         # Input validation
├── services/
│   ├── order.service.js      # Order management
│   └── email.service.js      # Email notifications
├── utils/
│   └── helpers.js            # Utility functions
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Configured cross-origin resource sharing
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Joi schema validation
- **Webhook Signature Verification** - Validates Stripe webhooks
- **Environment Variables** - Sensitive data protection

## 📧 Email Configuration (Optional)

To enable order confirmation emails, add to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Gmail Setup:**

1. Enable 2-factor authentication
2. Generate an app password: https://myaccount.google.com/apppasswords
3. Use the generated password in `SMTP_PASS`

## 💾 Database Configuration (Production)

For production, replace the in-memory storage with a real database:

1. **Install database driver:**

   ```bash
   npm install pg  # PostgreSQL
   # or
   npm install mysql2  # MySQL
   # or
   npm install mongodb  # MongoDB
   ```

2. **Add to `.env`:**

   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/itapring
   ```

3. **Update `services/order.service.js`** with real database queries

## 🚀 Deployment

### Deploy to Production:

1. **Update environment variables:**

   - Use live Stripe keys (start with `sk_live_`)
   - Set `NODE_ENV=production`
   - Update `CLIENT_URL` to your production domain

2. **Configure webhooks in Stripe Dashboard:**

   - Go to: https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to `.env`

3. **Deploy to your platform:**
   - **Heroku:** `git push heroku main`
   - **Vercel:** `vercel deploy`
   - **Railway:** `railway up`
   - **DigitalOcean/AWS:** Use PM2 or Docker

### Using PM2 (Process Manager):

```bash
npm install -g pm2
pm2 start server.js --name itapring-server
pm2 save
pm2 startup
```

## 🐛 Troubleshooting

### Webhook signature verification failed

- Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- Use Stripe CLI for local testing
- Check that raw body is being sent to webhook endpoint

### CORS errors

- Verify `CLIENT_URL` in `.env` matches your frontend URL
- Check that CORS is enabled before other middleware

### Rate limit errors

- Adjust rate limits in `middleware/rateLimiter.js`
- Consider whitelisting your IP in development

### Checkout session creation fails

- Verify Stripe secret key is correct
- Check that all required fields are provided
- Review Stripe Dashboard logs

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Checkout](https://stripe.com/docs/checkout/quickstart)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Express.js Docs](https://expressjs.com/)

## 🤝 Support

For issues or questions:

- Email: support@itapring.com
- Stripe Support: https://support.stripe.com

## 📄 License

MIT License - see LICENSE file for details

---

**Made with ❤️ for iTapRing**
# iTapRing-server
