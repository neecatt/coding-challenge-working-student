import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import ticketRoutes from './routes/ticketRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { 
  errorHandler, 
  notFound, 
  handleUnhandledRejection, 
  handleUncaughtException 
} from './middleware/errorHandler.js';
import { 
  globalRateLimit, 
  speedLimiter 
} from './middleware/rateLimiting.js';
import { 
  requestSizeLimit, 
  parameterLimit, 
  securityHeaders, 
  securityHealthCheck 
} from './middleware/requestSecurity.js';
import logger from './config/logger.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 4000;

// Set up global error handlers for unhandled rejections and exceptions
process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};

// Security and rate limiting middleware (applied first)
app.use(securityHeaders);
app.use(globalRateLimit);
app.use(speedLimiter);

// Request parsing middleware with size limits
app.use(requestSizeLimit);
app.use(parameterLimit);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb', parameterLimit: 1000 }));
app.use(express.text({ limit: '1mb' }));
app.use(express.raw({ limit: '10mb' }));

// CORS and request logging
app.use(cors(corsOptions));
app.use(requestLogger);

// Health check endpoints
app.get('/health', securityHealthCheck);
app.get('/api/health', securityHealthCheck);

// Basic health endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Ticket System API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      tickets: '/api/tickets'
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);

// 404 handler for undefined routes (must be after all routes)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: corsOptions.origin,
    timestamp: new Date().toISOString()
  });
});

export default app;
