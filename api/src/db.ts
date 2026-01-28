/**
 * Database Client
 *
 * Prisma client instance for database operations.
 * Exported separately to avoid circular dependencies.
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
