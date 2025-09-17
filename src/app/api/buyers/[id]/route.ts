// src/app/api/buyers/[id]/route.ts - Fixed TypeScript Issues
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers, buyerHistory } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { updateBuyerSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// Define the history type explicitly
interface BuyerHistoryRecord {
  id: string
  buyerId: string
  changedBy: string
  changedAt: Date
  diff: any
}

// Helper function to get user from request
function getUserFromRequest(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email') || 'demo@example.com'
  const userRole = request.headers.get('x-user-role') || 'user'
  
  return {
    id: 'demo-user-1',
    email: userEmail,
    role: userRole // 'admin' | 'user'
  }
}

// Helper function to check ownership or admin
async function checkOwnershipOrAdmin(buyerId: string, currentUser: any) {
  const buyer = await db.select().from(buyers).where(eq(buyers.id, buyerId)).limit(1)
  
  if (!buyer.length) {
    return { authorized: false, buyer: null, reason: 'Buyer not found' }
  }

  // Admin can access all
  if (currentUser.role === 'admin') {
    return { authorized: true, buyer: buyer[0], reason: 'Admin access' }
  }

  // Owner can access their own
  if (buyer[0].ownerId === currentUser.id) {
    return { authorized: true, buyer: buyer[0], reason: 'Owner access' }
  }

  return { authorized: false, buyer: buyer[0], reason: 'Not authorized - not owner' }
}

// GET /api/buyers/[id] - Anyone can view (read-only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Fetching buyer with ID:', params.id)

    const buyer = await db.select().from(buyers).where(eq(buyers.id, params.id)).limit(1)
    
    if (!buyer.length) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      )
    }

    // Get buyer history with explicit typing
    let history: BuyerHistoryRecord[] = []
    try {
      const historyResult = await db.select().from(buyerHistory)
        .where(eq(buyerHistory.buyerId, params.id))
        .orderBy(desc(buyerHistory.changedAt))
        .limit(10)
      
      // Explicitly type the history result
      history = historyResult as BuyerHistoryRecord[]
    } catch (historyError) {
      console.warn('Failed to fetch history:', historyError)
      // history remains empty array
    }

    console.log('Found buyer:', buyer[0])

    return NextResponse.json({
      buyer: buyer[0],
      history
    })
  } catch (error) {
    console.error('Error fetching buyer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch buyer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}


// PUT /api/buyers/[id] - Only owner or admin can update
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('Updating buyer with data:', body)
    
    // Get current user
    const currentUser = getUserFromRequest(request)
    
    // Check ownership or admin
    const ownershipCheck = await checkOwnershipOrAdmin(params.id, currentUser)
    
    if (!ownershipCheck.authorized) {
      return NextResponse.json(
        { error: `Access denied: ${ownershipCheck.reason}` },
        { status: 403 }
      )
    }

    // Clean and validate data
    const cleanedData = {
      fullName: body.fullName || '',
      email: body.email || undefined,
      phone: body.phone || '',
      city: body.city || 'Chandigarh',
      propertyType: body.propertyType || 'Apartment',
      bhk: body.bhk || undefined,
      purpose: body.purpose || 'Buy',
      budgetMin: body.budgetMin || undefined,
      budgetMax: body.budgetMax || undefined,
      timeline: body.timeline || '0-3m',
      source: body.source || 'Website',
      status: body.status || 'New',
      notes: body.notes || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
    }

    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof typeof cleanedData] === undefined) {
        delete cleanedData[key as keyof typeof cleanedData]
      }
    })

    const simpleSchema = updateBuyerSchema
    const validatedData = simpleSchema.parse(cleanedData)

    // Update buyer
    const updatedBuyer = await db.update(buyers)
      .set({
        fullName: validatedData.fullName,
        email: validatedData.email || null,
        phone: validatedData.phone,
        city: validatedData.city,
        propertyType: validatedData.propertyType,
        bhk: validatedData.bhk || null,
        purpose: validatedData.purpose,
        budgetMin: validatedData.budgetMin || null,
        budgetMax: validatedData.budgetMax || null,
        timeline: validatedData.timeline,
        source: validatedData.source,
        status: validatedData.status,
        notes: validatedData.notes || null,
        tags: validatedData.tags || [],
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, params.id))
      .returning()

    // Log changes in history
    try {
      const changes: Record<string, { from: any; to: any }> = {}
      
      if (validatedData.status !== ownershipCheck.buyer?.status) {
        changes.status = {
          from: ownershipCheck.buyer?.status,
          to: validatedData.status
        }
      }

      if (Object.keys(changes).length > 0) {
        await db.insert(buyerHistory).values({
          buyerId: params.id,
          changedBy: currentUser.id,
          diff: { action: 'updated', changes }
        })
      }
    } catch (historyError) {
      console.warn('Failed to log update history:', historyError)
    }

    console.log('Updated buyer:', updatedBuyer[0])

    return NextResponse.json(updatedBuyer[0])
  } catch (error) {
    console.error('Error updating buyer:', error)
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update buyer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE /api/buyers/[id] - Only owner or admin can delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Deleting buyer with ID:', params.id)

    // Get current user
    const currentUser = getUserFromRequest(request)
    
    // Check ownership or admin
    const ownershipCheck = await checkOwnershipOrAdmin(params.id, currentUser)
    
    if (!ownershipCheck.authorized) {
      return NextResponse.json(
        { error: `Access denied: ${ownershipCheck.reason}` },
        { status: 403 }
      )
    }

    const deletedBuyer = await db.delete(buyers)
      .where(eq(buyers.id, params.id))
      .returning()

    if (!deletedBuyer.length) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      )
    }

    console.log('Deleted buyer:', deletedBuyer[0])

    return NextResponse.json({ 
      message: 'Buyer deleted successfully',
      deletedBuyer: deletedBuyer[0]
    })
  } catch (error) {
    console.error('Error deleting buyer:', error)
    return NextResponse.json(
      { error: 'Failed to delete buyer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
