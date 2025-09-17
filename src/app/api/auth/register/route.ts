// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Registration attempt:', { ...body, password: '[HIDDEN]', confirmPassword: '[HIDDEN]' })

    // Validate input
    const validatedData = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, validatedData.email)).limit(1)
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)

    // Create user (all new users are 'user' role by default, only admin can make other admins)
    const newUser = await db.insert(users).values({
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      password: hashedPassword,
      role: 'user', // Always create as user role
      isActive: true
    }).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt
    })

    console.log('User created successfully:', newUser[0])

    return NextResponse.json({
      message: 'User registered successfully',
      user: newUser[0]
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    )
  }
}
