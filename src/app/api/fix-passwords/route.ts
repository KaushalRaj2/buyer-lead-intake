// src/app/api/fix-passwords/route.ts - Regenerate Passwords
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST() {
  try {
    console.log('Regenerating user passwords...')
    
    // Hash the passwords properly
    const adminHash = await bcrypt.hash('admin123', 12)
    const demoHash = await bcrypt.hash('demo123', 12)
    
    console.log('Generated hashes:')
    console.log('Admin hash:', adminHash)
    console.log('Demo hash:', demoHash)
    
    // Update admin password
    const adminUpdate = await db.update(users)
      .set({ password: adminHash, updatedAt: new Date() })
      .where(eq(users.email, 'admin@example.com'))
      .returning({ id: users.id, email: users.email })
    
    // Update demo password  
    const demoUpdate = await db.update(users)
      .set({ password: demoHash, updatedAt: new Date() })
      .where(eq(users.email, 'demo@example.com'))
      .returning({ id: users.id, email: users.email })
    
    // Test the new passwords
    const adminTest = await bcrypt.compare('admin123', adminHash)
    const demoTest = await bcrypt.compare('demo123', demoHash)
    
    return NextResponse.json({
      success: true,
      message: 'Passwords regenerated successfully',
      updates: {
        admin: adminUpdate[0] || null,
        demo: demoUpdate[0] || null
      },
      tests: {
        adminPasswordWorks: adminTest,
        demoPasswordWorks: demoTest
      }
    })
    
  } catch (error) {
    console.error('Password fix error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fix passwords',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
