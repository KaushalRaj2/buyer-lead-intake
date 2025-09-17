// src/app/api/test-db/route.ts - Database Connection Test
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Database test starting...')
    console.log('Environment variables check:')
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20))
    
    // Try importing database
    const { db } = await import('@/lib/db')
    const { users } = await import('@/db/schema')
    console.log('✅ Database imports successful')
    
    // Try simple query
    const result = await db.select().from(users).limit(1)
    console.log('✅ Database query successful, users found:', result.length)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      userCount: result.length,
      environment: process.env.NODE_ENV
    })
    
  } catch (error) {
    console.error('💥 Database test failed:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      environment: process.env.NODE_ENV
    }, { status: 500 })
  }
}
