# 🎫 DoNexus Coding Challenge - Ticket Management System

My solution to the **DoNexus Backend Working Student** coding challenge. This project implements a complete ticket management system with a strong focus on **security best practices** and **Docker containerization**.

## 🎯 **Challenge Overview**

**Original Requirements:**
- Connect Backend ↔ PostgreSQL (✅ Prisma ORM)
- Connect Frontend ↔ Backend (✅ Complete CRUD API)  
- Implement JWT authentication (✅ With refresh tokens)
- Add Row-Level Security (✅ Organization-based isolation)
- Add one extra security measure (✅ Multiple layers implemented)

**My Approach:** I went significantly beyond the minimum requirements to showcase modern security practices and production-ready development patterns.

## 🚀 Quick Start with Docker

### Prerequisites
- **Docker** (v20.10+)
- **Docker Compose** (v2.0+)
- **Git**

### 1. Clone & Configure

```bash
git clone <repository-url>
cd coding-challenge-working-student

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration

Update your `.env` file with secure values:

```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_database_password_here
DB_NAME=ticket_system

# Security Configuration (CRITICAL: Change in production!)
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars-long
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-at-least-32-chars-long

# Application Ports
FRONTEND_PORT=5173
BACKEND_PORT=4000
DB_PORT=5432
```

### 3. Launch Application

```bash
# Build and start all services
docker-compose up --build

# Or run in background
docker-compose up --build -d
```

### 4. Access Your Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

## 🧪 **Testing the Application**

### **Option 1: Register Your Own User (Recommended)**

1. **Register a new account** through the frontend at http://localhost:5173 or via API:
   - Go to the registration page in the frontend
   - Create an account with your own email and password
   - Use `organisationId: 1` to join the Acme Corp organization

2. **Login with your new account** and start testing:
   - Login through the frontend interface
   - Create, update, and delete tickets
   - Test the complete functionality with your own data

### **Option 2: Use Pre-configured Test Users**

If you prefer, you can also use these existing test accounts:
- `alice@acme.com` / `SecurePass123!` (ADMIN role)
- `bob@acme.com` / `SecurePass123!` (USER role)  
- `carol@globex.com` / `SecurePass123!` (MANAGER role)

**Note:** Users can only see tickets from their own organization (organization-level data isolation).

## 📝 **Challenge Requirements Implemented**

### ✅ **Original DoNexus Challenge Tasks**
1. **Backend ↔ PostgreSQL Connection**: ✅ Implemented with Prisma ORM
2. **Frontend ↔ Backend Connection**: ✅ Complete CRUD API with React integration  
3. **Security & Best Practices**: ✅ JWT authentication, RBAC, and comprehensive security layers

### 🔥 **Going Beyond the Requirements**
While the challenge asked for basic functionality and one extra security measure, I implemented a **comprehensive security-focused architecture** to demonstrate best practices in modern web application development.

## 🔐 **Security Implementation Details**

This solution implements multiple layers of security, going well beyond the basic requirements:

### 🛡️ **Multi-Layer Security Features**

#### **1. Authentication & Authorization**
- **JWT-based authentication** with access & refresh token rotation
- **Role-based access control** (ADMIN, USER, MANAGER)
- **Strong password policies** (12+ chars, complexity requirements)
- **Secure password hashing** with bcrypt (12 salt rounds)
- **Token expiration** (15min access, 7d refresh)
- **Automatic token cleanup** and revocation

#### **2. Advanced Rate Limiting**
- **Global rate limiting**: 1,000 requests/15min per IP
- **Authentication protection**: 5 login attempts/15min per IP
- **API rate limiting**: 500 requests/15min per IP  
- **User-specific limits**: 200 requests/15min per authenticated user
- **Progressive speed limiting** with adaptive delays
- **DDoS protection** with intelligent throttling

#### **3. Request Security & Validation**
- **Request size limiting** (10MB maximum)
- **Parameter pollution protection** (1,000 parameter limit)
- **Input sanitization** and validation middleware
- **XSS protection** headers
- **CSRF protection** via SameSite cookies
- **MIME type validation**

#### **4. Infrastructure Security**
- **Docker containerization** with non-root users
- **Network isolation** with custom Docker networks
- **Environment-based secrets** management
- **Security headers** (X-Frame-Options, CSP, etc.)
- **CORS configuration** with whitelist origins
- **Database connection encryption**

#### **5. Monitoring & Logging**
- **Comprehensive audit logging** for all requests
- **Security event tracking** (failed logins, rate limits)
- **Error tracking** with detailed context
- **Health monitoring** with security status
- **Request/response logging** with sanitized data

#### **6. Data Protection**
- **Encrypted passwords** (never stored in plaintext)
- **Secure database transactions** with Prisma ORM
- **Input validation** on all endpoints
- **SQL injection prevention** via parameterized queries
- **Organization-level data isolation**

## 🎯 **Implemented Features**

### **Core Challenge Requirements**
- **Multi-tenant ticket management** with organization isolation
- **CRUD operations** for tickets (GET, POST, DELETE, PATCH)
- **JWT authentication** with role-based access control
- **Organization-level data separation** (users only see their org's tickets)
- **Responsive React frontend** connecting to Node.js backend

### **Additional Security & Production Features**
- **Refresh token rotation** for enhanced security
- **Multi-layer rate limiting** and request validation
- **Comprehensive logging** and error handling
- **Docker containerization** with health checks
- **Database seeding** with test data


## 🔌 **API Endpoints**

### **Authentication (`/api/auth`)**
- `POST /register` - Register new user account
- `POST /login` - Login with email/password 
- `GET /me` - Get current user info (authenticated)
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout and invalidate tokens

### **Tickets (`/api/tickets`)**
- `GET /` - List all tickets (organization-scoped)
- `GET /:id` - Get specific ticket
- `POST /` - Create new ticket
- `PATCH /:id` - Update ticket
- `DELETE /:id` - Delete ticket

### **Health Monitoring**
- `GET /health` - Security health check
- `GET /` - API info endpoint

### **🧪 Quick Test**
1. **Register**: `POST /api/auth/register` with `name`, `email`, `password`, `organisationId`
2. **Login**: `POST /api/auth/login` to get access token
3. **Create Ticket**: `POST /api/tickets` with Bearer token
4. **View Tickets**: `GET /api/tickets` with Bearer token




### **Database Management**
```bash
# Access database directly
docker-compose exec database psql -U postgres -d ticket_system

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Seed database with test data(Already seeded in the initial run)
docker-compose exec backend npx prisma db seed

# Reset database (⚠️ DELETES ALL DATA)
docker-compose exec backend npx prisma migrate reset --force
```



## 💭 **What I Implemented**

### **Technical Implementation**
- **Complete full-stack solution** with React frontend and Node.js backend
- **Database integration** using Prisma ORM with PostgreSQL
- **Comprehensive authentication system** with JWT and refresh tokens
- **Role-based access control** with organization-level data isolation
- **Comprehensive testing** using Jest and Supertest to check all the functionalities
- **Advanced security middleware** including rate limiting and request validation
- **Docker containerization** for consistent deployment across environments

### **Security Focus** 
The challenge asked for "one extra security measure" - I implemented **multiple layers**:
- Multi-tiered rate limiting (global, auth, user-specific)
- Request size and parameter limiting
- Comprehensive logging and monitoring
- Security headers and CORS configuration
- Strong password policies and secure token handling

### **What I Would Do Next**
- **WebSocket integration** for real-time ticket updates
- **Email notifications** for ticket status changes  
- **File upload functionality** for ticket attachments
- **Advanced search and filtering** capabilities
- **API documentation** with Swagger/OpenAPI
- **CI/CD pipeline** with automated testing and deployment

## 📞 **Questions or Feedback?**

I look forward to hearing from you about the feedback or questions about the project!

---
