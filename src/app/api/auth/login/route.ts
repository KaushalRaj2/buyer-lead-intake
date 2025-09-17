// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Login attempt for:', body.email)

    // Validate input
    const validatedData = loginSchema.parse(body)

    // Find user
    const user = await db.select().from(users)
      .where(eq(users.email, validatedData.email.toLowerCase()))
      .limit(1)
    
    if (!user.length) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const foundUser = user[0]

    // Check if user is active
    if (!foundUser.isActive) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, foundUser.password)
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Return user data (excluding password)
    const { password, ...userWithoutPassword } = foundUser
    
    console.log('Login successful for:', foundUser.email)

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword
    })

  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    )
  }
}
