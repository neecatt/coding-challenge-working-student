import AuthService from '../services/authService.js';
import UserService from '../services/userService.js';
import { 
  sendSuccess, 
  sendCreated, 
  sendUnauthorized, 
  sendConflict, 
  sendValidationError, 
  sendNotFound,
  handleError 
} from '../utils/responseHandler.js';
import { ValidationError, UnauthorizedError, ConflictError, NotFoundError } from '../utils/errors.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organisationId } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !organisationId) {
      return sendValidationError(res, 'All fields are required (name, email, password, organisationId)');
    }

    // UserService will handle validation and throw appropriate errors
    const user = await UserService.createUser({ name, email, password, organisationId });
    
    return sendCreated(res, { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        createdAt: user.createdAt
      } 
    }, 'User registered successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return sendValidationError(res, 'Email and password are required');
    }

    const user = await UserService.findByEmail(email);
    if (!user) {
      return sendUnauthorized(res, 'Invalid credentials');
    }

    const isValidPassword = await AuthService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return sendUnauthorized(res, 'Invalid credentials');
    }

    // Update last login time
    await UserService.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = AuthService.generateAccessToken({ 
      userId: user.id, 
      role: user.role 
    });
    
    const refreshToken = AuthService.generateRefreshToken({ 
      userId: user.id, 
      role: user.role 
    });

    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10) * 24 * 60 * 60 * 1000));
    await AuthService.storeRefreshToken(user.id, refreshToken, expiresAt);

    return sendSuccess(res, {
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        organisationId: user.organisationId,
        lastLoginAt: user.lastLoginAt
      }
    }, 'Login successful');
  } catch (error) {
    return handleError(res, error);
  }
};

export const me = async (req, res, next) => {
  try {
    // User info is already attached by the auth middleware
    const user = await UserService.findById(req.user.id);
    
    return sendSuccess(res, {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    }, 'User information retrieved successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return sendValidationError(res, 'Refresh token is required', 'refreshToken');
    }

    try {
      await AuthService.revokeRefreshToken(refreshToken);
    } catch (error) {
    }

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    return handleError(res, error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return sendValidationError(res, 'Refresh token is required', 'refreshToken');
    }

    // Validate refresh token from database
    const dbToken = await AuthService.validateRefreshToken(refreshToken);
    
    // Verify JWT signature
    const payload = AuthService.verifyToken(refreshToken);

    // Generate new access token
    const accessToken = AuthService.generateAccessToken({ 
      userId: payload.userId, 
      role: payload.role 
    });

    return sendSuccess(res, { 
      accessToken 
    }, 'Token refreshed successfully');
  } catch (error) {
    return handleError(res, error);
  }
}; 