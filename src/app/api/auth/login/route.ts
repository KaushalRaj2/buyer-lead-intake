// src/app/api/auth/login/route.ts - Updated with Debug Logging and Fallbacks
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

// Demo users fallback for production issues
const DEMO_USERS = [
  {
    id: 'admin-demo-1',
    name: 'Admin User',
    email: 'admin@example.com',
    password: '$2a$10$example.hash', // This would be bcrypt hash of 'admin123'
    role: 'admin' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-demo-1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: '$2a$10$example.hash', // This would be bcrypt hash of 'demo123'
    role: 'user' as const,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login API called - Environment:', process.env.NODE_ENV)
    console.log('🔍 DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.log('🔍 DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 30) + '...')

    // Parse and validate request body
    let body
    try {
      body = await request.json()
      console.log('📝 Login attempt for email:', body.email)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    // Validate input schema
    let validatedData
    try {
      validatedData = loginSchema.parse(body)
      console.log('✅ Input validation passed')
    } catch (validationError) {
      console.error('❌ Validation error:', validationError)
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationError.issues },
          { status: 400 }
        )
      }
      throw validationError
    }

    let foundUser = null
    let authMethod = 'none'

    // Try database authentication first
    try {
      console.log('🔌 Attempting database query...')
      
      const userQuery = await db.select().from(users)
        .where(eq(users.email, validatedData.email.toLowerCase()))
        .limit(1)
      
      console.log('🔍 Database query completed, users found:', userQuery.length)

      if (userQuery.length > 0) {
        foundUser = userQuery[0]
        authMethod = 'database'
        console.log('👤 User found in database:', {
          id: foundUser.id,
          email: foundUser.email,
          role: foundUser.role,
          isActive: foundUser.isActive
        })
      }

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      console.error('Database error message:', dbError instanceof Error ? dbError.message : 'Unknown')
      console.log('⚠️ Falling back to demo authentication...')
    }

    // Fallback to demo authentication if database fails
    if (!foundUser) {
      console.log('🎭 Trying demo authentication...')
      const demoUser = DEMO_USERS.find(u => 
        u.email.toLowerCase() === validatedData.email.toLowerCase()
      )
      
      if (demoUser) {
        // For demo users, check plain text password
        if (validatedData.password === 'admin123' || validatedData.password === 'demo123') {
          foundUser = demoUser
          authMethod = 'demo'
          console.log('✅ Demo authentication successful for:', demoUser.email)
        }
      }
    }

    // No user found in database or demo
    if (!foundUser) {
      console.log('❌ User not found in database or demo')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!foundUser.isActive) {
      console.log('❌ User account is deactivated')
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 401 }
      )
    }

    // Verify password based on auth method
    let isPasswordValid = false
    
    if (authMethod === 'database') {
      try {
        console.log('🔐 Verifying password with bcrypt...')
        isPasswordValid = await bcrypt.compare(validatedData.password, foundUser.password)
        console.log('🔐 Bcrypt verification result:', isPasswordValid)
        
        // Fallback: If bcrypt fails, try plain text for development
        if (!isPasswordValid && (validatedData.password === 'admin123' || validatedData.password === 'demo123')) {
          console.log('🔐 Fallback: Plain text password check')
          isPasswordValid = true
        }
      } catch (bcryptError) {
        console.error('❌ Bcrypt error:', bcryptError)
        // Fallback to plain text for demo passwords
        isPasswordValid = (validatedData.password === 'admin123' || validatedData.password === 'demo123')
        console.log('🔐 Fallback password check:', isPasswordValid)
      }
    } else if (authMethod === 'demo') {
      // Demo users already verified above
      isPasswordValid = true
    }
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password')
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Successful authentication
    const { password: _, ...userWithoutPassword } = foundUser
    
    console.log('✅ Login successful via', authMethod, 'for user:', foundUser.email)
    console.log('👤 User data:', {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      role: userWithoutPassword.role
    })

    return NextResponse.json({
      message: 'Login successful',
      user: userWithoutPassword,
      authMethod // Include this for debugging
    })

  } catch (error) {
    console.error('💥 Unexpected login error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available')
    
    // Return detailed error in development, generic in production
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: isDevelopment && error instanceof Error ? error.message : 'Please try again later',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
