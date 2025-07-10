import { PrismaClient } from '@prisma/client';
import AuthService from './authService.js';
import { ValidationError, NotFoundError, ConflictError, DatabaseError } from '../utils/errors.js';

const prisma = new PrismaClient();

class UserService {
  // Create a new user with hashed password
  static async createUser({ name, email, password, role = 'USER', organisationId }) {
    try {
      // Validate required fields
      if (!name || name.trim().length === 0) {
        throw new ValidationError('Name is required', 'name');
      }
      
      if (!email || email.trim().length === 0) {
        throw new ValidationError('Email is required', 'email');
      }
      
      if (!password) {
        throw new ValidationError('Password is required', 'password');
      }
      
      if (!organisationId) {
        throw new ValidationError('Organisation ID is required', 'organisationId');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new ValidationError('Invalid email format', 'email');
      }

      // Check if email is unique
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }

      // Validate password strength (throws ValidationError if invalid)
      AuthService.validatePasswordStrength(password);

      const hashedPassword = await AuthService.hashPassword(password);
      
      return await prisma.user.create({
        data: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          role,
          organisationId: parseInt(organisationId),
        },
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      
      // Handle Prisma specific errors
      if (error.code === 'P2002') {
        throw new ConflictError('Email already in use');
      }
      
      if (error.code === 'P2003') {
        throw new ValidationError('Invalid organisation ID', 'organisationId');
      }
      
      throw new DatabaseError('Failed to create user', error);
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      if (!email) {
        throw new ValidationError('Email is required', 'email');
      }

      return await prisma.user.findUnique({ 
        where: { email: email.trim().toLowerCase() } 
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to find user by email', error);
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required', 'id');
      }

      const user = await prisma.user.findUnique({ 
        where: { id: parseInt(id) } 
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      return user;
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError('Failed to find user by ID', error);
    }
  }

  // Update user (generic)
  static async updateUser(id, data) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required', 'id');
      }

      // Check if user exists
      await this.findById(id);

      // Validate email if provided
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new ValidationError('Invalid email format', 'email');
        }
        
        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({ 
          where: { email: data.email.trim().toLowerCase() } 
        });
        
        if (existingUser && existingUser.id !== parseInt(id)) {
          throw new ConflictError('Email already in use');
        }
        
        data.email = data.email.trim().toLowerCase();
      }

      // Validate name if provided
      if (data.name !== undefined && (!data.name || data.name.trim().length === 0)) {
        throw new ValidationError('Name cannot be empty', 'name');
      }

      if (data.name) {
        data.name = data.name.trim();
      }

      return await prisma.user.update({ 
        where: { id: parseInt(id) }, 
        data 
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      
      if (error.code === 'P2002') {
        throw new ConflictError('Email already in use');
      }
      
      if (error.code === 'P2025') {
        throw new NotFoundError('User');
      }
      
      throw new DatabaseError('Failed to update user', error);
    }
  }

  // Check if email is unique
  static async isEmailUnique(email) {
    try {
      if (!email) {
        throw new ValidationError('Email is required', 'email');
      }

      const user = await prisma.user.findUnique({ 
        where: { email: email.trim().toLowerCase() } 
      });
      
      return !user;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError('Failed to check email uniqueness', error);
    }
  }

  // Update password (with hash)
  static async updatePassword(id, newPassword) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required', 'id');
      }

      if (!newPassword) {
        throw new ValidationError('New password is required', 'password');
      }

      // Check if user exists
      await this.findById(id);

      // Validate password strength (throws ValidationError if invalid)
      AuthService.validatePasswordStrength(newPassword);

      const hashedPassword = await AuthService.hashPassword(newPassword);
      
      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      
      if (error.code === 'P2025') {
        throw new NotFoundError('User');
      }
      
      throw new DatabaseError('Failed to update password', error);
    }
  }

  // Update last login time
  static async updateLastLogin(id) {
    try {
      if (!id) {
        throw new ValidationError('User ID is required', 'id');
      }

      return await prisma.user.update({
        where: { id: parseInt(id) },
        data: {
          lastLoginAt: new Date(),
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundError('User');
      }
      
      throw new DatabaseError('Failed to update last login time', error);
    }
  }
}

export default UserService; 