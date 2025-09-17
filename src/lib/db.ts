// src/lib/db.ts - Fixed for Production with Debug Logging
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

console.log('🔍 Database Environment Check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL exists:', !!databaseUrl);

if (!databaseUrl) {
  console.error('❌ DATABASE_URL is not defined in environment variables');
  throw new Error('DATABASE_URL environment variable is required');
}

// Log connection details (without exposing credentials)
const connectionInfo = {
  isSupabase: databaseUrl.includes('supabase.com'),
  isLocalhost: databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1'),
  protocol: databaseUrl.split('://')[0],
  host: databaseUrl.includes('@') ? databaseUrl.split('@')[1]?.split(':')[0] : 'unknown',
  port: databaseUrl.includes(':') ? databaseUrl.split(':').pop()?.split('/')[0] : 'unknown'
};

console.log('🔌 Connection Info:', connectionInfo);

if (connectionInfo.isLocalhost && process.env.NODE_ENV === 'production') {
  console.error('⚠️ WARNING: Using localhost database URL in production environment!');
  console.error('This will cause connection failures. Please update DATABASE_URL to use Supabase.');
}

// Create postgres client with Supabase-optimized settings
const client = postgres(databaseUrl, { 
  prepare: false, // Required for Supabase connection pooling
  max: process.env.NODE_ENV === 'production' ? 1 : 10, // Limit connections in serverless
  idle_timeout: 20,
  connect_timeout: 60,
  transform: {
    undefined: null, // Transform undefined to null for database compatibility
  },
  onnotice: process.env.NODE_ENV === 'development' ? console.log : () => {}, // Log notices in development only
});

// Create drizzle instance
export const db = drizzle(client, { schema });

// Database connection test function
export async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Simple connection test
    const result = await client`SELECT 1 as test, current_database() as db_name, version() as version`;
    
    console.log('✅ Database connection successful');
    console.log('Database name:', result[0]?.db_name);
    console.log('PostgreSQL version:', result[0]?.version?.split(' ')[0]);
    
    return {
      success: true,
      database: result[0]?.db_name,
      version: result[0]?.version?.split(' ')[0],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    // Detailed error analysis
    if (error instanceof Error) {
      const errorInfo = {
        message: error.message,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall,
        address: (error as any).address,
        port: (error as any).port
      };
      
      console.error('Error details:', errorInfo);
      
      // Specific error guidance
      if (errorInfo.code === 'ECONNREFUSED') {
        console.error('🚨 Connection refused - this usually means:');
        console.error('1. Database URL is pointing to localhost in production');
        console.error('2. Database server is not running');
        console.error('3. Firewall is blocking the connection');
        console.error('4. Wrong host/port in connection string');
      } else if (errorInfo.code === 'ENOTFOUND') {
        console.error('🚨 Host not found - check your DATABASE_URL host');
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Connection health check for API routes
export async function healthCheck() {
  try {
    const start = Date.now();
    await client`SELECT 1`;
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      response_time: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Graceful shutdown handler
export async function closeConnection() {
  try {
    await client.end();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

export type DB = typeof db;

// Export client for advanced usage
export { client };
