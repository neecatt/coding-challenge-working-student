import prisma from '../db/prisma.js';
import { logDbOperation, logError } from './logHelper.js';

// Database service layer for consistent query execution
export const executeQuery = async (query, params, operation, table, meta = {}) => {
  try {
    const startTime = Date.now();
    const result = await prisma.$queryRawUnsafe(query, ...params);
    const duration = Date.now() - startTime;
    
    logDbOperation(operation, table, duration, {
      resultCount: Array.isArray(result) ? result.length : 1,
      ...meta
    });
    
    return result;
  } catch (error) {
    logError(`Database ${operation} failed on ${table}`, error, { query, params, ...meta });
    throw error;
  }
};

// Execute multiple queries in parallel
export const executeQueries = async (queries) => {
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(
      queries.map(({ query, params, operation, table, meta }) =>
        executeQuery(query, params, operation, table, meta)
      )
    );
    
    const duration = Date.now() - startTime;
    logDbOperation('BATCH', 'multiple', duration, { 
      queryCount: queries.length,
      operations: queries.map(q => q.operation)
    });
    
    return results;
  } catch (error) {
    logError('Batch query execution failed', error, { queries });
    throw error;
  }
};

// Execute transaction
export const executeTransaction = async (operations) => {
  const startTime = Date.now();
  
  try {
    const result = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const { query, params, operation, table, meta } of operations) {
        const queryResult = await tx.$queryRawUnsafe(query, ...params);
        results.push(queryResult);
        
        logDbOperation(operation, table, 0, { 
          resultCount: Array.isArray(queryResult) ? queryResult.length : 1,
          transaction: true,
          ...meta
        });
      }
      return results;
    });
    
    const duration = Date.now() - startTime;
    logDbOperation('TRANSACTION', 'multiple', duration, { 
      operationCount: operations.length,
      operations: operations.map(op => op.operation)
    });
    
    return result;
  } catch (error) {
    logError('Transaction failed', error, { operations });
    throw error;
  }
}; 