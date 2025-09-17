// src/app/api/debug-db/route.ts
import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/db'

export async function GET() {
  try {
    console.log('🔍 Current DATABASE_URL:', process.env.DATABASE_URL)
    
    // Test connection and get database info
    const connectionTest = await testConnection()
    
    return NextResponse.json({
      success: true,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...',
      isSupabase: process.env.DATABASE_URL?.includes('supabase.com'),
      isLocalhost: process.env.DATABASE_URL?.includes('localhost') || process.env.DATABASE_URL?.includes('127.0.0.1'),
      connectionTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + '...',
    }, { status: 500 })
  }
}
