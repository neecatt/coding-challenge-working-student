import AuthService from '../services/authService.js';
import UserService from '../services/userService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const register = async (req, res, next) => {
  try {
    const { name, email, password, organisationId } = req.body;
    if (!name || !email || !password || !organisationId) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (!AuthService.validatePasswordStrength(password)) {
      return res.status(400).json({ message: 'Password does not meet strength requirements.' });
    }
    const isUnique = await UserService.isEmailUnique(email);
    if (!isUnique) {
      return res.status(409).json({ message: 'Email already in use.' });
    }
    const user = await UserService.createUser({ name, email, password, organisationId });
    return res.status(201).json({ message: 'User registered successfully.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await UserService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const valid = await AuthService.verifyPassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Update last login time
    await UserService.updateLastLogin(user.id);
    // Generate tokens
    const accessToken = AuthService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = AuthService.generateRefreshToken({ userId: user.id, role: user.role });
    // Store refresh token in DB
    const expiresAt = new Date(Date.now() + (parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN_DAYS || '7', 10) * 24 * 60 * 60 * 1000));
    await AuthService.storeRefreshToken(user.id, refreshToken, expiresAt);
    return res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    // User info is already attached by the auth middleware
    const user = await UserService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required.' });
    }
    await AuthService.revokeRefreshToken(refreshToken);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token required.' });
    }
    const dbToken = await AuthService.validateRefreshToken(refreshToken);
    if (!dbToken) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
    const payload = AuthService.verifyToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }
    // Optionally rotate refresh token here
    const accessToken = AuthService.generateAccessToken({ userId: payload.userId, role: payload.role });
    return res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}; 