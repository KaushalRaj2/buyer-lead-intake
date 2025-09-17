// src/app/api/admin/users/route.ts - Fixed TypeScript Issues
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Get current user from headers
async function getCurrentUser(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email')
  const userRole = request.headers.get('x-user-role')
  const userId = request.headers.get('x-user-id')
  
  if (!userEmail) {
    throw new Error('Authentication required')
  }

  // If we have user ID and role, use them directly
  if (userId && userId.length > 10 && userRole) {
    return { 
      id: userId, 
      email: userEmail, 
      role: userRole as 'user' | 'admin' 
    }
  }

  // Otherwise look up by email
  try {
    const user = await db.select({
      id: users.id,
      email: users.email,
      role: users.role
    }).from(users)
    .where(eq(users.email, userEmail.toLowerCase()))
    .limit(1)
    
    if (!user.length) {
      throw new Error('User not found')
    }

    return user[0]
  } catch (error) {
    console.error('Database lookup failed:', error)
    throw new Error('Failed to authenticate user')
  }
}

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    console.log('Admin users API called')
    
    const currentUser = await getCurrentUser(request)
    console.log('Current user:', currentUser)
    
    // Check if user is admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Fetch all users from database
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt
    }).from(users)
    .orderBy(users.createdAt)

    console.log(`Found ${allUsers.length} users`)

    return NextResponse.json({
      users: allUsers,
      total: allUsers.length
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
