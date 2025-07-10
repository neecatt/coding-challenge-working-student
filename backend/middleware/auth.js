import AuthService from '../services/authService.js';
import UserService from '../services/userService.js';

// Middleware to verify JWT token and extract user info
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Get user from database to ensure they still exist
    const user = await UserService.findById(payload.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisationId
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Optional authentication middleware (for routes that can work with or without auth)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without user info
    }

    const payload = AuthService.verifyToken(token);
    if (!payload) {
      return next(); // Continue without user info
    }

    const user = await UserService.findById(payload.userId);
    if (!user) {
      return next(); // Continue without user info
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organisationId: user.organisationId
    };

    next();
  } catch (error) {
    next(); // Continue without user info
  }
};

// Middleware to check if user has required role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

// Middleware to ensure user can only access their own resources
export const requireOwnership = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const currentUserId = req.user.id;
    const resourceUserIdToCheck = req.params[resourceUserId] || req.body[resourceUserId];

    if (currentUserId !== parseInt(resourceUserIdToCheck)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    next();
  };
}; 