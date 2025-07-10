import express from 'express';
import { register, login, logout, refresh, me } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimit } from '../middleware/rateLimiting.js';
import logger from '../config/logger.js';

const router = express.Router();

if (process.env.NODE_ENV !== 'production') {
  router.post('/frontend-log', (req, res) => {
    const { level, method, endpoint, data, response, error, timestamp } = req.body;
    
    const logMessage = `[FRONTEND API] ${method} ${endpoint}`;
    const logData = {
      timestamp: timestamp || new Date().toISOString(),
      method,
      endpoint,
      ...(data && { requestData: data }),
      ...(response && { responseData: response }),
      ...(error && { error })
    };

    if (level === 'error') {
      logger.error(logMessage, logData);
    } else {
      logger.info(logMessage, logData);
    }

    res.status(200).json({ success: true });
  });
}

// Auth routes with strict rate limiting
router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', logout); 
router.post('/refresh', authRateLimit, refresh);
router.get('/me', authenticateToken, me);

export default router; 