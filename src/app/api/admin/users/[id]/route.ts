// src/app/api/admin/users/[id]/route.ts - Simplified with Database Cascade
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, buyers, buyerHistory } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'

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

// PUT /api/admin/users/[id] - Update user role or status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Updating user:', params.id)
    
    const currentUser = await getCurrentUser(request)
    console.log('Current user:', currentUser)
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    console.log('Update data:', body)
    
    const { role, isActive } = body
    const targetUserId = params.id

    // Validate user exists first
    const existingUser = await db.select({
      id: users.id,
      role: users.role,
      name: users.name
    }).from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

    if (!existingUser.length) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admin from changing their own role
    if (targetUserId === currentUser.id && role !== undefined) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    // Build update object with proper typing
    const updates: {
      role?: 'user' | 'admin'
      isActive?: boolean
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (role !== undefined) {
      if (role !== 'user' && role !== 'admin') {
        return NextResponse.json(
          { error: 'Invalid role. Must be "user" or "admin"' },
          { status: 400 }
        )
      }
      updates.role = role
    }
    
    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid isActive value. Must be boolean' },
          { status: 400 }
        )
      }
      updates.isActive = isActive
    }

    console.log('Applying updates:', updates)

    // Update user in database
    const updatedUser = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, targetUserId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        updatedAt: users.updatedAt
      })

    if (!updatedUser.length) {
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    console.log('User updated successfully:', updatedUser[0])

    return NextResponse.json({ 
      success: true,
      user: updatedUser[0]
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/users/[id] - Simplified with Database Cascade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== DELETE USER START ===')
    console.log('Target user ID:', params.id)
    
    const currentUser = await getCurrentUser(request)
    console.log('Current admin user:', currentUser)
    
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const targetUserId = params.id

    // Prevent admin from deleting themselves
    if (targetUserId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    // 1. Check if user exists and get associated buyers count
    console.log('Step 1: Checking user and counting buyers...')
    const existingUser = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role
    }).from(users)
    .where(eq(users.id, targetUserId))
    .limit(1)

    if (!existingUser.length) {
      console.log('User not found')
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const userToDelete = existingUser[0]
    console.log('Found user to delete:', userToDelete)

    // Count associated buyers before deletion
    const associatedBuyers = await db.select({
      id: buyers.id,
      fullName: buyers.fullName
    }).from(buyers)
    .where(eq(buyers.ownerId, targetUserId))

    console.log(`Found ${associatedBuyers.length} associated buyers`)

    // 2. Option A: Transfer buyers to another admin (recommended)
    if (associatedBuyers.length > 0) {
      console.log('Step 2: Finding admin to transfer buyers to...')
      const adminUsers = await db.select({
        id: users.id,
        name: users.name
      }).from(users)
      .where(
        and(
          eq(users.role, 'admin'),
          ne(users.id, targetUserId),
          eq(users.isActive, true)
        )
      )
      .limit(1)

      if (adminUsers.length > 0) {
        const adminRecipient = adminUsers[0]
        console.log(`Transferring buyers to admin: ${adminRecipient.name}`)
        
        await db
          .update(buyers)
          .set({ 
            ownerId: adminRecipient.id,
            updatedAt: new Date()
          })
          .where(eq(buyers.ownerId, targetUserId))

        console.log(`Transferred ${associatedBuyers.length} buyers to ${adminRecipient.name}`)
      } else {
        console.log('No other admins found - buyers will be orphaned (ownerId set to null)')
      }
    }

    // 3. Delete the user - database will handle cascading via "set null"
    console.log('Step 3: Deleting user from database...')
    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, targetUserId))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      })

    if (!deletedUser.length) {
      console.log('Failed to delete user from database')
      return NextResponse.json(
        { error: 'Failed to delete user from database' },
        { status: 500 }
      )
    }

    console.log('User deleted successfully:', deletedUser[0])
    console.log('=== DELETE USER SUCCESS ===')

    return NextResponse.json({ 
      success: true,
      deletedUser: deletedUser[0],
      transferredBuyers: associatedBuyers.length,
      message: associatedBuyers.length > 0 
        ? `User deleted and ${associatedBuyers.length} buyers transferred`
        : 'User deleted successfully'
    })

  } catch (error) {
    console.error('=== DELETE USER ERROR ===')
    console.error('Error details:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      console.error('Specific error message:', error.message)
      
      if (error.message.includes('violates foreign key constraint')) {
        return NextResponse.json(
          { error: 'Cannot delete user due to database constraints' },
          { status: 409 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to delete user. Please try again.' },
      { status: 500 }
    )
  }
}
