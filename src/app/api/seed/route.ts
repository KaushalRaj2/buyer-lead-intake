// src/app/api/seed/route.ts - Database Seeder
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('🌱 Seeding database...')
    
    // Try to connect and create users
    const existingUsers = await db.select().from(users).limit(5)
    console.log('Existing users:', existingUsers.length)
    
    if (existingUsers.length === 0) {
      console.log('Creating demo users...')
      
      // Create admin user
      const adminUser = await db.insert(users).values({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123', // In production, hash this
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
      
      // Create demo user  
      const demoUser = await db.insert(users).values({
        name: 'Demo User',
        email: 'demo@example.com', 
        password: 'demo123', // In production, hash this
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning()
      
      console.log('✅ Users created:', { admin: adminUser[0]?.id, demo: demoUser[0]?.id })
    }
    
    // Get all users
    const allUsers = await db.select().from(users)
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      userCount: allUsers.length,
      users: allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive
      }))
    })
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Seeding failed',
      details: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 })
  }
}
