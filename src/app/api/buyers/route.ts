// src/app/api/buyers/route.ts - Fixed with Better Error Handling and Debug Logging
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers, buyerHistory, users } from '@/db/schema'
import { eq, desc, or, ilike, and, count } from 'drizzle-orm'
import { createBuyerSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// Helper function to get user from request headers
async function getUserFromRequest(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email')
  const userRole = request.headers.get('x-user-role')
  const userId = request.headers.get('x-user-id')
  
  console.log('🔍 Headers received:', { userEmail, userRole, userId: !!userId })
  
  if (!userEmail) {
    throw new Error('User email not provided in headers. Please ensure you are logged in.')
  }

  // If we have a user ID and it looks like a UUID, use it directly
  if (userId && userId !== '' && userId.length > 10) {
    console.log('✅ Using provided user ID:', userId)
    return {
      id: userId,
      email: userEmail,
      role: userRole || 'user'
    }
  }

  // Otherwise, look up user by email
  console.log('🔍 Looking up user by email:', userEmail)
  try {
    const user = await db.select({
      id: users.id,
      email: users.email,
      role: users.role
    }).from(users)
    .where(eq(users.email, userEmail.toLowerCase()))
    .limit(1)

    if (!user.length) {
      throw new Error(`User not found with email: ${userEmail}. Please register first.`)
    }

    console.log('✅ Found user from database:', { id: user[0].id, email: user[0].email, role: user[0].role })
    return {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role
    }
  } catch (dbError) {
    console.error('💥 Database lookup failed:', dbError)
    throw new Error(`Failed to find user: ${userEmail}. Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`)
  }
}

// GET /api/buyers - List buyers (all can read)
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/buyers called')
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const city = searchParams.get('city') || ''
    const status = searchParams.get('status') || ''
    const propertyType = searchParams.get('propertyType') || ''

    console.log('📋 API called with params:', { page, limit, search, city, status, propertyType })

    // Get current user for role-based access
    let currentUser = null
    try {
      currentUser = await getUserFromRequest(request)
      console.log('👤 Current user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role })
    } catch (authError) {
      console.error('⚠️ Authentication failed, returning empty results:', authError)
      return NextResponse.json({
        buyers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        },
        error: 'Authentication required'
      })
    }

    try {
      console.log('🔌 Attempting database query...')

      // Build where conditions array
      const conditions = []
      
      // Role-based access control
      if (currentUser && currentUser.role === 'user') {
        conditions.push(eq(buyers.ownerId, currentUser.id))
        console.log('🔒 User role: filtering by ownerId =', currentUser.id)
      } else if (currentUser && currentUser.role === 'admin') {
        console.log('👑 Admin role: accessing all buyers')
      }
      
      if (search) {
        conditions.push(
          or(
            ilike(buyers.fullName, `%${search}%`),
            ilike(buyers.phone, `%${search}%`),
            ilike(buyers.email, `%${search}%`)
          )
        )
        console.log('🔍 Search filter applied:', search)
      }

      if (city && city !== 'All Cities') {
        conditions.push(eq(buyers.city, city as any))
        console.log('🏙️ City filter applied:', city)
      }
      
      if (status && status !== 'All Statuses') {
        conditions.push(eq(buyers.status, status as any))
        console.log('📊 Status filter applied:', status)
      }
      
      if (propertyType && propertyType !== 'All Types') {
        conditions.push(eq(buyers.propertyType, propertyType as any))
        console.log('🏠 Property type filter applied:', propertyType)
      }

      // Combine conditions with AND
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get buyers with pagination
      const offset = (page - 1) * limit
      
      const result = await db
        .select()
        .from(buyers)
        .where(whereClause)
        .orderBy(desc(buyers.updatedAt))
        .limit(limit)
        .offset(offset)

      console.log('✅ Buyers query successful, found:', result.length)

      // Get total count for pagination
      const totalResult = await db
        .select({ count: count() })
        .from(buyers)
        .where(whereClause)

      const total = totalResult[0]?.count || 0
      console.log('📊 Total buyers:', total)

      return NextResponse.json({
        buyers: result,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      })

    } catch (dbError) {
      console.error('💥 Database error:', dbError)
      console.error('Database error message:', dbError instanceof Error ? dbError.message : 'Unknown')
      
      // Return empty results as fallback
      return NextResponse.json({
        buyers: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        },
        fallback: true,
        error: 'Database connection failed - showing empty results'
      })
    }

  } catch (error) {
    console.error('💥 GET buyers error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch buyers', 
        details: error instanceof Error ? error.message : 'Unknown error',
        buyers: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 }
      },
      { status: 500 }
    )
  }
}

// POST /api/buyers - Create new buyer (assigns to current user)
export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST /api/buyers called')
    
    const body = await request.json()
    console.log('📝 Creating buyer with data:', { ...body, phone: '***' })
    
    // Get current user - this will throw an error if headers are missing
    let currentUser
    try {
      currentUser = await getUserFromRequest(request)
      console.log('👤 Current user:', { id: currentUser.id, email: currentUser.email, role: currentUser.role })
    } catch (authError) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required', details: authError instanceof Error ? authError.message : 'Unknown auth error' },
        { status: 401 }
      )
    }
    
    // Clean the data before validation
    const cleanedData = {
      fullName: body.fullName || '',
      email: body.email || undefined,
      phone: body.phone || '',
      city: body.city || 'Chandigarh',
      propertyType: body.propertyType || 'Apartment',
      bhk: body.bhk || undefined,
      purpose: body.purpose || 'Buy',
      budgetMin: body.budgetMin ? parseInt(body.budgetMin) : undefined,
      budgetMax: body.budgetMax ? parseInt(body.budgetMax) : undefined,
      timeline: body.timeline || '0-3m',
      source: body.source || 'Website',
      notes: body.notes || undefined,
      tags: Array.isArray(body.tags) ? body.tags : [],
    }

    // Remove undefined values
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key as keyof typeof cleanedData] === undefined) {
        delete cleanedData[key as keyof typeof cleanedData]
      }
    })

    console.log('🧹 Cleaned data:', cleanedData)
    
    try {
      // Validate input
      const validatedData = createBuyerSchema.parse(cleanedData)
      console.log('✅ Data validation passed')

      // Insert into database with current user as owner
      console.log('💾 Inserting buyer with owner ID:', currentUser.id)
      
      const newBuyer = await db.insert(buyers).values({
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
        notes: validatedData.notes || null,
        tags: validatedData.tags || [],
        ownerId: currentUser.id, // This should be a UUID
        status: 'New'
      }).returning()

      console.log('✅ Buyer created successfully:', newBuyer[0]?.id)

      // Log creation in history
      try {
        await db.insert(buyerHistory).values({
          buyerId: newBuyer[0].id,
          changedBy: currentUser.id,
          diff: { action: 'created', data: validatedData }
        })
        console.log('📝 History logged successfully')
      } catch (historyError) {
        console.warn('⚠️ Failed to log history (non-critical):', historyError)
      }

      return NextResponse.json(newBuyer[0], { status: 201 })

    } catch (dbError) {
      console.error('💥 Database error creating buyer:', dbError)
      return NextResponse.json(
        { error: 'Failed to create buyer', details: dbError instanceof Error ? dbError.message : 'Database error' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 POST buyers error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    
    if (error instanceof ZodError) {
      console.error('❌ Validation error:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    // Enhanced error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const statusCode = errorMessage.includes('User email not provided') || 
                      errorMessage.includes('User not found') ? 401 : 500
    
    return NextResponse.json(
      { error: 'Failed to create buyer', details: errorMessage },
      { status: statusCode }
    )
  }
}
