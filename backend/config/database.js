import prisma from '../db/prisma.js';
import logger from './logger.js';

// Database connection test
export const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closeConnection = async () => {
  try {
    await prisma.$disconnect();
    logger.info('✅ Database connection closed');
  } catch (error) {
    logger.error('❌ Error closing database connection:', error);
  }
};

export default prisma; 