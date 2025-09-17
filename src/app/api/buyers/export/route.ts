// src/app/api/buyers/export/route.ts - Fixed with Ownership Control
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers, users } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

// Same getUserFromRequest function
async function getUserFromRequest(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email')
  const userRole = request.headers.get('x-user-role')
  const userId = request.headers.get('x-user-id')
  
  console.log('Export - Headers received:', { userEmail, userRole, userId })
  
  if (!userEmail) {
    throw new Error('User email not provided in headers. Please login first.')
  }

  // If we have a valid UUID, use it directly
  if (userId && userId !== '' && userId.length > 10) {
    return {
      id: userId,
      email: userEmail,
      role: userRole || 'user'
    }
  }

  // Otherwise, look up user by email
  try {
    const user = await db.select({
      id: users.id,
      email: users.email,
      role: users.role
    }).from(users)
    .where(eq(users.email, userEmail.toLowerCase()))
    .limit(1)

    if (!user.length) {
      throw new Error(`User not found with email: ${userEmail}`)
    }

    return {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role
    }
  } catch (error) {
    console.error('Export - Database lookup failed:', error)
    throw new Error(`Failed to find user: ${userEmail}`)
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getUserFromRequest(request)
    console.log('Export - Current user:', currentUser)

    let allBuyers

    if (currentUser.role === 'admin') {
      // Admin can export all buyers
      console.log('Export - Admin user: exporting all buyers')
      allBuyers = await db.select().from(buyers).orderBy(desc(buyers.updatedAt))
    } else {
      // Regular users can only export their own buyers
      console.log('Export - Regular user: exporting only owned buyers')
      allBuyers = await db.select()
        .from(buyers)
        .where(eq(buyers.ownerId, currentUser.id))
        .orderBy(desc(buyers.updatedAt))
    }

    console.log(`Export - Found ${allBuyers.length} buyers for user ${currentUser.email}`)

    // Convert to CSV format
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone',
      'City',
      'Property Type',
      'BHK',
      'Purpose',
      'Budget Min',
      'Budget Max',
      'Timeline',
      'Source',
      'Status',
      'Notes',
      'Tags',
      'Owner ID',
      'Created At',
      'Updated At'
    ]

    const csvRows = [
      headers.join(','),
      ...allBuyers.map(buyer => [
        buyer.id,
        `"${buyer.fullName}"`,
        buyer.email || '',
        buyer.phone,
        buyer.city,
        buyer.propertyType,
        buyer.bhk || '',
        buyer.purpose,
        buyer.budgetMin || '',
        buyer.budgetMax || '',
        buyer.timeline,
        buyer.source,
        buyer.status,
        buyer.notes ? `"${buyer.notes.replace(/"/g, '""')}"` : '',
        Array.isArray(buyer.tags) ? `"${buyer.tags.join(', ')}"` : '',
        buyer.ownerId,
        buyer.createdAt.toISOString(),
        buyer.updatedAt.toISOString()
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const userType = currentUser.role === 'admin' ? 'admin-all' : 'user-owned'
    const fileName = `buyers-export-${userType}-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    })
  } catch (error) {
    console.error('Error exporting buyers:', error)
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('User email not provided')) {
      return NextResponse.json(
        { error: 'Authentication required. Please login first.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to export buyers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
