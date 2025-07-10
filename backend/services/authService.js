import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { ValidationError, UnauthorizedError, DatabaseError } from '../utils/errors.js';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const JWT_REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

class AuthService {
  // Hash a password
  static async hashPassword(password) {
    try {
      return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    } catch (error) {
      throw new DatabaseError('Failed to hash password', error);
    }
  }

  // Verify a password
  static async verifyPassword(password, hash) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      throw new DatabaseError('Failed to verify password', error);
    }
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 12;
    const maxLength = parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || 128;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
    
    if (typeof password !== 'string') {
      throw new ValidationError('Password must be a string', 'password');
    }
    
    if (password.length < minLength) {
      throw new ValidationError(`Password must be at least ${minLength} characters long`, 'password');
    }
    
    if (password.length > maxLength) {
      throw new ValidationError(`Password must be no more than ${maxLength} characters long`, 'password');
    }
    
    if (!strongRegex.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character', 'password');
    }
    
    return true;
  }

  // Generate access token
  static generateAccessToken(payload) {
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN });
    } catch (error) {
      throw new DatabaseError('Failed to generate access token', error);
    }
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN });
    } catch (error) {
      throw new DatabaseError('Failed to generate refresh token', error);
    }
  }

  // Verify token
  static verifyToken(token) {
    try {
      if (!JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
      }
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Token expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  // Store refresh token in database
  static async storeRefreshToken(userId, refreshToken, expiresAt) {
    try {
      return await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: parseInt(userId),
          expiresAt: expiresAt,
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to store refresh token', error);
    }
  }

  // Validate refresh token from database
  static async validateRefreshToken(refreshToken) {
    try {
      const dbToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!dbToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      if (dbToken.isRevoked) {
        throw new UnauthorizedError('Refresh token has been revoked');
      }

      if (dbToken.expiresAt < new Date()) {
        // Clean up expired token
        await this.revokeRefreshToken(refreshToken);
        throw new UnauthorizedError('Refresh token expired');
      }

      return dbToken;
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new DatabaseError('Failed to validate refresh token', error);
    }
  }

  // Revoke refresh token
  static async revokeRefreshToken(refreshToken) {
    try {
      return await prisma.refreshToken.update({
        where: { token: refreshToken },
        data: { isRevoked: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        // Token not found - already revoked or doesn't exist
        return null;
      }
      throw new DatabaseError('Failed to revoke refresh token', error);
    }
  }

  // Clean up expired refresh tokens
  static async cleanupExpiredTokens() {
    try {
      return await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            {
              expiresAt: {
                lt: new Date(),
              },
            },
            {
              isRevoked: true,
            }
          ]
        },
      });
    } catch (error) {
      throw new DatabaseError('Failed to cleanup expired tokens', error);
    }
  }
}

export default AuthService; 