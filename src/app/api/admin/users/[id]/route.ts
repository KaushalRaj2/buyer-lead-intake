// src/app/api/admin/users/[id]/route.ts - Fixed Delete with Proper Cascade Handling
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, buyers } from '@/db/schema'
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
      updatedAt?: Date
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

// DELETE /api/admin/users/[id] - Delete user with proper cascade handling
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

    // 1. Check if user exists
    console.log('Step 1: Checking if user exists...')
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

    // 2. Find associated buyers
    console.log('Step 2: Finding associated buyers...')
    const associatedBuyers = await db.select({
      id: buyers.id,
      fullName: buyers.fullName,
      ownerId: buyers.ownerId
    }).from(buyers)
    .where(eq(buyers.ownerId, targetUserId))

    console.log(`Found ${associatedBuyers.length} associated buyers`)

    if (associatedBuyers.length > 0) {
      // 3. Find an admin user to transfer buyers to
      console.log('Step 3: Finding admin user to transfer buyers to...')
      const adminUsers = await db.select({
        id: users.id,
        name: users.name
      }).from(users)
      .where(
        and(
          eq(users.role, 'admin'),
          ne(users.id, targetUserId), // Not the user being deleted
          eq(users.isActive, true)    // Active admin
        )
      )
      .limit(1)

      if (adminUsers.length > 0) {
        const adminRecipient = adminUsers[0]
        console.log(`Transferring ${associatedBuyers.length} buyers to admin: ${adminRecipient.name}`)
        
        // Transfer buyers to the admin
        const transferResult = await db
          .update(buyers)
          .set({ 
            ownerId: adminRecipient.id,
            updatedAt: new Date()
          })
          .where(eq(buyers.ownerId, targetUserId))
          .returning({ id: buyers.id })

        console.log(`Successfully transferred ${transferResult.length} buyers`)
      } else {
        // No other admins available, set ownerId to null
        console.log('No other admins available, setting ownerId to null')
        const nullifyResult = await db
          .update(buyers)
          .set({ 
            ownerId: null,
            updatedAt: new Date()
          })
          .where(eq(buyers.ownerId, targetUserId))
          .returning({ id: buyers.id })

        console.log(`Set ownerId to null for ${nullifyResult.length} buyers`)
      }
    }

    // 4. Delete the user
    console.log('Step 4: Deleting user from database...')
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
        ? `User deleted and ${associatedBuyers.length} buyers transferred to admin`
        : 'User deleted successfully'
    })

  } catch (error) {
    console.error('=== DELETE USER ERROR ===')
    console.error('Error details:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Cannot delete user - they have associated data that cannot be transferred' },
          { status: 409 }
        )
      }
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }
      
      // Log the actual error for debugging
      console.error('Specific error message:', error.message)
    }

    return NextResponse.json(
      { error: 'Failed to delete user. Please check server logs for details.' },
      { status: 500 }
    )
  }
}
