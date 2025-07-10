import { PrismaClient } from '@prisma/client';
import AuthService from './authService.js';

const prisma = new PrismaClient();

class UserService {
  // Create a new user with hashed password
  static async createUser({ name, email, password, role = 'USER', organisationId }) {
    const hashedPassword = await AuthService.hashPassword(password);
    return prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        organisationId,
      },
    });
  }

  // Find user by email
  static async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  }

  // Find user by ID
  static async findById(id) {
    return prisma.user.findUnique({ where: { id } });
  }

  // Update user (generic)
  static async updateUser(id, data) {
    return prisma.user.update({ where: { id }, data });
  }

  // Check if email is unique
  static async isEmailUnique(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    return !user;
  }

  // Update password (with hash)
  static async updatePassword(id, newPassword) {
    const hashedPassword = await AuthService.hashPassword(newPassword);
    return prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });
  }

  // Update last login time
  static async updateLastLogin(id) {
    return prisma.user.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }
}

export default UserService; 