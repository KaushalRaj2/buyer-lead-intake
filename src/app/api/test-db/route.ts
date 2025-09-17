// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers } from '@/db/schema'

export async function GET() {
  try {
    // Test the database connection
    const result = await db.select().from(buyers).limit(1)
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection working',
      tableExists: true,
      sampleData: result
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}