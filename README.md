# Subscription Overloader

A comprehensive subscription management platform that helps users track, manage, and analyze their recurring subscriptions and payments.

## 📋 Overview

Subscription Overloader is a full-stack web application built with the MERN stack (MongoDB, Express.js, React, Node.js) that provides users with complete control over their subscription ecosystem. From tracking monthly expenses to managing payment schedules, the platform offers intuitive tools to tame subscription overload.

## 🎨 Features

### Core Functionality
- **User Authentication**: Secure registration, login, email verification, and password reset
- **Subscription Management**: Add, edit, track, and categorize subscriptions
- **Transaction Tracking**: Record and filter payment history with date ranges
- **Dashboard**: Visual overview of spending patterns and upcoming renewals
- **Insights & Analytics**: Data-driven views into subscription spending
- **Notifications**: System alerts for upcoming renewals and events
- **Profile Management**: User settings and account details

### Technical Features
- JWT-based authentication with refresh tokens
- Email verification and password reset flows
- File upload support for profile pictures
- Role-based access control
- RESTful API design
- Responsive React frontend with Tailwind CSS
- MongoDB data persistence with Mongoose ODM

## 🏗️ Architecture

### Backend (Node.js/Express)
```
backend/
├── controllers/       # Route controllers
├── models/            # MongoDB schemas (Mongoose)
├── routes/            # API endpoint definitions
├── middleware/        # Auth, error handling, uploads
├── services/          # Business logic (auth service)
├── utils/             # Helper functions (email)
├── uploads/           # File storage
└── index.js           # Application entry point
```

### Frontend (React)
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── contexts/      # React context providers
│   ├── services/      # API clients
│   └── App.jsx        # Main application
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SubscriptionOverloader
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   ```

### Configuration

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=8001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/subscription-overload

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS (comma-separated for multiple origins)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Email (Resend API)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Subscription Manager <onboarding@resend.dev>

# File Upload
MAX_FILE_SIZE=2097152  # 2MB
```

**Security Note**: Never commit `.env` files or expose secrets. Add `.env` to `.gitignore`.

### Running the Application

**Development Mode**:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Production Mode**:
```bash
# Backend
cd backend
npm start

# Frontend (build)
cd frontend
npm run build
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email/:token` - Verify email
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `POST /api/auth/logout` - Logout user

### Subscriptions
- `GET /api/subscriptions` - Get all subscriptions
- `POST /api/subscriptions` - Create subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription

### Transactions
- `GET /api/transactions` - List transactions (filterable)
- `GET /api/transactions/:id` - Get transaction details

### Dashboard
- `GET /api/dashboard/snapshot` - Dashboard summary
- `GET /api/dashboard/analytics` - Spending analytics

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/:id/read` - Mark as read

### Profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/upload` - Upload profile picture

### Email
- `POST /api/email/test` - Send test email

## 🔐 Authentication

The application uses **JWT (JSON Web Tokens)** for stateless authentication:

1. User logs in with email/password
2. Server validates credentials against MongoDB
3. JWT access token returned (stored in HTTP-only cookie)
4. Subsequent requests include the token automatically
5. Middleware verifies token and attaches user to `req.user`

**Security Features**:
- Passwords hashed with bcrypt (10 rounds)
- Tokens stored in HTTP-only, secure cookies
- Email verification required
- Rate limiting on auth endpoints
- CSRF protection via same-site cookies

## 🗄️ Database Schema

### User
```javascript
{
  name: String,              // Display name
  email: String,             // Unique, indexed
  password: String,          // Hashed
  isVerified: Boolean,       // Email verification status
  profilePictureUrl: String, // Optional
  verificationToken: String, // Email verification
  verificationExpires: Date,
  resetToken: String,        // Password reset
  resetExpires: Date
}
```

### Subscription
```javascript
{
  userId: ObjectId,          // Reference to User
  serviceName: String,       // e.g., "Netflix"
  category: String,          // e.g., "Entertainment"
  amount: Number,            // Monthly cost
  currency: String,          // e.g., "USD"
  billingCycle: String,      // monthly/yearly/weekly
  startDate: Date,
  nextBillingDate: Date,
  status: String,            // active/cancelled/paused
  notes: String,             // Optional notes
  autoRenewal: Boolean
}
```

### Transaction
```javascript
{
  userId: ObjectId,          // Reference to User
  subscriptionId: ObjectId,  // Optional reference
  amount: Number,
  date: Date,
  category: String,
  status: String,            // completed/pending/failed
  notes: String
}
```

## 🛡️ Security Best Practices

### Implemented
- ✅ Environment variable protection
- ✅ Input validation and sanitization
- ✅ SQL/NoSQL injection prevention (Mongoose)
- ✅ XSS protection (React escaping)
- ✅ CSRF protection (same-site cookies)
- ✅ Rate limiting on sensitive endpoints
- ✅ Error handling without information leakage
- ✅ File upload validation (type, size)
- ✅ Password complexity requirements
- ✅ Email verification flow

### Recommendations
- Use HTTPS in production
- Enable 2FA for admin accounts
- Regular dependency updates
- Security audit with tools like `npm audit`
- Implement monitoring and logging
- Use a Web Application Firewall (WAF)

## 🧪 Testing

Install test dependencies:
```bash
cd backend
npm install
```

Run tests:
```bash
npm test
```

Test coverage includes:
- Auth flow (register, login, verification)
- CRUD operations (subscriptions, transactions)
- Error handling
- Edge cases

## 📦 Dependencies

### Backend
- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT handling
- **cors**, **cookie-parser**: HTTP utilities
- **multer**: File uploads
- **node-cron**: Scheduled tasks
- **resend**: Email service

### Frontend
- **react**, **react-dom**: UI library
- **react-router-dom**: Client-side routing
- **lucide-react**: Icons
- **sonner**: Toast notifications
- **Tailwind CSS**: Styling

## 🐛 Troubleshooting

### Common Issues

**"Cannot connect to MongoDB"**
- Verify MongoDB is running: `mongod`
- Check connection string in `.env`
- Ensure network access (cloud MongoDB)

**"Invalid credentials" on login**
- Verify email is verified (check database)
- Reset password if needed

**"Email failed to send"**
- Check Resend API key
- Verify sender email configuration
- Check spam folder

**CORS errors**
- Add frontend origin to `CORS_ORIGINS` in `.env`
- Use comma-separated list for multiple origins

## 📝 Git Guidelines

### What to Track
- ✅ Source code (`.js`, `.jsx`, `.json`)
- ✅ Configuration (non-sensitive)
- ✅ Documentation (`.md`)
- ✅ Tests (`test/`, `__tests__/`)

### What to Ignore
- ❌ `.env` files (credentials)
- ❌ `node_modules/` (dependencies)
- ❌ Build artifacts (`dist/`, `build/`)
- ❌ Logs (`*.log`)
- ❌ IDE configs (`.vscode/`, `.idea/`)
- ❌ Temporary files (`*.tmp`, `*.bak`)

### Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `bugfix/*`: Bug fixes
- `hotfix/*`: Critical production fixes

### Commit Messages
Use conventional commits:
```
feat: add subscription filtering
fix: resolve transaction date parsing
chore: update dependencies
```
