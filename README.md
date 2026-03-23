# Fintech Payment & Subscription Management Platform

A scalable, production-ready MERN stack platform for handling payments and subscriptions with Stripe and PayPal integration, supporting 10,000+ concurrent users and 5,000+ daily transactions.

## 🚀 Features

- **Payment Processing**: Full Stripe and PayPal integration with secure checkout flows
- **Subscription Management**: Multiple pricing plans, recurring billing, customer portal
- **Authentication**: OAuth 2.0 (Google) + JWT with RBAC (user/admin roles)
- **Real-time Webhooks**: Secure webhook processing for payment events
- **Admin Dashboard**: Analytics, transaction management, user oversight
- **User Dashboard**: Subscription management, billing history, payment methods
- **Scalability**: Designed for high concurrency with Redis caching and optimized database queries
- **Security**: Webhook signature verification, rate limiting, secure headers
- **Production Ready**: Docker containerization, Kubernetes manifests, AWS deployment ready

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Next.js)     │◄──►│   (Express)     │◄──►│   (MongoDB)     │
│                 │    │                 │    │                 │
│ - React 18      │    │ - TypeScript    │    │ - Collections   │
│ - Tailwind CSS  │    │ - JWT Auth      │    │ - Indexes       │
│ - Zustand       │    │ - Stripe API    │    │ - Validation    │
│ - TanStack Query│    │ - PayPal API    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │      Redis      │
                    │   (Caching)     │
                    │                 │
                    │ - Sessions      │
                    │ - Rate Limits   │
                    │ - Cache Store   │
                    └─────────────────┘
```

## 📁 Project Structure

```
fintech-payment-platform/
├── frontend/                    # Next.js 15 frontend application
│   ├── src/
│   │   ├── app/                # App Router pages
│   │   ├── components/         # Reusable React components
│   │   ├── lib/               # Utility libraries
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── store/             # Zustand state management
│   │   └── utils/             # Helper functions
│   ├── public/                # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── Dockerfile
├── backend/                     # Express.js backend API
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   ├── services/          # Business logic services
│   │   ├── utils/             # Utility functions
│   │   ├── types/             # TypeScript types
│   │   └── config/            # Configuration files
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── k8s/                        # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── hpa.yaml
│   └── ingress.yaml
├── docker/                     # Docker configurations
│   ├── nginx.conf
│   └── mongo-init.js
├── docker-compose.yml          # Local development setup
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Zustand** for state management
- **TanStack Query** for server state
- **Zod** for validation
- **React Hook Form** for forms

### Backend
- **Node.js + Express** with TypeScript
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Passport.js** for OAuth
- **Stripe** and **PayPal** SDKs
- **Winston** for logging
- **Express Rate Limit** for protection

### Infrastructure
- **Docker** & **Docker Compose**
- **Kubernetes** for orchestration
- **Nginx** as reverse proxy
- **Redis** for caching
- **AWS** for cloud deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- MongoDB (if running locally)
- Redis (if running locally)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fintech-payment-platform
```

### 2. Environment Setup
```bash
# Frontend environment
cp frontend/.env.example frontend/.env.local

# Backend environment  
cp backend/.env.example backend/.env
```

### 3. Configure Environment Variables
Edit the `.env` files with your actual API keys:

**Frontend (.env.local):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**Backend (.env):**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
JWT_SECRET=your_super_secret_jwt_key_here
MONGODB_URI=mongodb://localhost:27017/fintech_payment
```

### 4. Docker Setup (Recommended)
```bash
# Start all services with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 5. Manual Setup (Alternative)
```bash
# Install dependencies
npm run install:all

# Start MongoDB and Redis
# (Make sure they're running on default ports)

# Start backend
cd backend
npm run dev

# Start frontend (new terminal)
cd frontend
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Admin Dashboard**: http://localhost:3000/admin
- **Default Admin**: admin@fintech.com / admin123

## 📝 Available Scripts

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Backend
```bash
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Root Level
```bash
npm run install:all  # Install dependencies for both frontend and backend
npm run dev          # Start both frontend and backend in development
npm run build        # Build both frontend and backend
npm run docker:up    # Start Docker Compose
npm run docker:down  # Stop Docker Compose
```

## 🔧 Configuration

### Payment Gateway Setup

#### Stripe
1. Create a Stripe account
2. Get API keys from Dashboard → Developers → API keys
3. Set up webhooks in Dashboard → Developers → Webhooks
4. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
5. Select events: `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.created`, etc.

#### PayPal
1. Create a PayPal Developer account
2. Create a REST API app
3. Get Client ID and Secret
4. Set up webhooks in Developer → Webhooks
5. Add webhook endpoint: `https://yourdomain.com/api/webhooks/paypal`

### Google OAuth Setup
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

## 📦 Deployment

### Docker Deployment
```bash
# Build and deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n fintech

# View logs
kubectl logs -f deployment/backend -n fintech
```

### AWS Deployment
See `docs/aws-deployment.md` for detailed AWS deployment instructions.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **OAuth 2.0**: Google OAuth integration
- **RBAC**: Role-based access control (user/admin)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Webhook Verification**: Signature verification for Stripe and PayPal
- **CORS Protection**: Proper CORS configuration
- **Security Headers**: XSS protection, content security policy
- **Input Validation**: Zod schema validation
- **Password Hashing**: bcrypt for secure password storage

## 📊 Monitoring & Analytics

- **Application Logs**: Winston structured logging
- **Performance Metrics**: Response time tracking
- **Error Tracking**: Comprehensive error handling
- **Business Analytics**: Revenue, churn rate, active users
- **Health Checks**: Docker health checks and API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Email: support@fintech-platform.com
- Documentation: [docs/](./docs/)

## 🗺️ Roadmap

- [ ] Multi-tenant support
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] More payment gateways (Square, Braintree)
- [ ] Subscription billing analytics
- [ ] Advanced fraud detection
- [ ] Multi-currency support
- [ ] Internationalization (i18n)

---

**Built with ❤️ for the fintech community**
