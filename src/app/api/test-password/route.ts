// src/app/api/test-password/route.ts - Test Password Verification
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('Testing password for:', email)
    
    // Get user from database
    const user = await db.select().from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)
    
    if (!user.length) {
      return NextResponse.json({
        success: false,
        message: 'User not found',
        email: email
      })
    }

    const foundUser = user[0]
    console.log('Found user:', { id: foundUser.id, email: foundUser.email, role: foundUser.role })
    console.log('Stored password hash:', foundUser.password.substring(0, 20) + '...')
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare(password, foundUser.password)
    console.log('Password verification result:', isPasswordValid)
    
    // Also test with known good hash
    const testHash = await bcrypt.hash(password, 12)
    const testVerification = await bcrypt.compare(password, testHash)
    console.log('Test hash verification (should be true):', testVerification)
    
    return NextResponse.json({
      success: isPasswordValid,
      message: isPasswordValid ? 'Password correct' : 'Password incorrect',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role,
        isActive: foundUser.isActive
      },
      debug: {
        passwordLength: foundUser.password.length,
        hashStart: foundUser.password.substring(0, 10),
        testVerification: testVerification
      }
    })
    
  } catch (error) {
    console.error('Password test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Password test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
