import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m';
const JWT_REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

class AuthService {
  // Hash a password
  static async hashPassword(password) {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  }

  // Compare a password with a hash
  static async verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  // Validate password strength
  static validatePasswordStrength(password) {
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || 12;
    const maxLength = parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || 128;
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/;
    if (
      typeof password !== 'string' ||
      password.length < minLength ||
      password.length > maxLength ||
      !strongRegex.test(password)
    ) {
      return false;
    }
    return true;
  }

  // Generate JWT access token
  static generateAccessToken(payload) {
    // Always include a unique jti to ensure a new token is generated
    return jwt.sign({ ...payload, jti: uuidv4() }, JWT_SECRET, {
      expiresIn: JWT_ACCESS_TOKEN_EXPIRES_IN,
    });
  }

  // Generate JWT refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_TOKEN_EXPIRES_IN,
    });
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return null;
    }
  }

  // Store refresh token in DB
  static async storeRefreshToken(userId, token, expiresAt) {
    return prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });
  }

  // Revoke refresh token
  static async revokeRefreshToken(token) {
    return prisma.refreshToken.updateMany({
      where: { token },
      data: { isRevoked: true },
    });
  }

  // Validate refresh token
  static async validateRefreshToken(token) {
    const dbToken = await prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!dbToken || dbToken.isRevoked || dbToken.expiresAt < new Date()) {
      return null;
    }
    return dbToken;
  }

  // Remove all refresh tokens for a user (logout everywhere)
  static async revokeAllRefreshTokensForUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}

export default AuthService; 