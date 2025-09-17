// src/app/api/buyers/import/route.ts - Fixed to Use Real UUIDs
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { createBuyerSchema } from '@/lib/validations'
import { ZodError } from 'zod'

// Same getUserFromRequest function as in buyers route
async function getUserFromRequest(request: NextRequest) {
  const userEmail = request.headers.get('x-user-email')
  const userRole = request.headers.get('x-user-role')
  const userId = request.headers.get('x-user-id')
  
  console.log('Import - Headers received:', { userEmail, userRole, userId })
  
  if (!userEmail) {
    throw new Error('User email not provided in headers. Please login first.')
  }

  // If we have a valid UUID, use it directly
  if (userId && userId !== '' && userId.length > 10) {
    console.log('Import - Using provided user ID:', userId)
    return {
      id: userId,
      email: userEmail,
      role: userRole || 'user'
    }
  }

  // Otherwise, look up user by email
  console.log('Import - Looking up user by email:', userEmail)
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

    console.log('Import - Found user:', user[0])
    return {
      id: user[0].id,
      email: user[0].email,
      role: user[0].role
    }
  } catch (error) {
    console.error('Import - Database lookup failed:', error)
    throw new Error(`Failed to find user: ${userEmail}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user first - ✅ ADDED THIS
    const currentUser = await getUserFromRequest(request)
    console.log('Import - Current user:', currentUser)

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const csvText = await file.text()
    const lines = csvText.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file must have header and at least one data row' }, { status: 400 })
    }

    // Parse header to understand column positions
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    console.log('CSV Headers:', headers)
    
    // Skip header row
    const dataLines = lines.slice(1)
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (let i = 0; i < dataLines.length; i++) {
      try {
        const line = dataLines[i]
        const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''))
        
        // Create buyer data object
        const buyerData = {
          fullName: columns[1] || '',
          email: columns[2] || undefined,
          phone: columns[3] || '',
          city: columns[4] || 'Chandigarh',
          propertyType: columns[5] || 'Apartment',
          bhk: columns[6] || undefined,
          purpose: columns[7] || 'Buy',
          budgetMin: columns[8] ? parseInt(columns[8]) : undefined,
          budgetMax: columns[9] ? parseInt(columns[9]) : undefined,
          timeline: columns[10] || '0-3m',
          source: columns[11] || 'Import',
          notes: columns[12] || undefined,
          tags: columns[13] ? columns[13].split(',').map(tag => tag.trim()) : []
        }

        // Validate using the create schema
        const validatedData = createBuyerSchema.parse(buyerData)
        
        // Insert into database with REAL user UUID
        await db.insert(buyers).values({
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
          status: 'New',
          ownerId: currentUser.id  // ✅ FIXED: Use real UUID instead of hardcoded string
        })

        results.success++
      } catch (error) {
        results.failed++
        const errorMsg = error instanceof ZodError 
          ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
          : error instanceof Error 
          ? error.message 
          : 'Invalid data'
        results.errors.push(`Row ${i + 2}: ${errorMsg}`)
        console.error(`Import row ${i + 2} error:`, error)
      }
    }

    return NextResponse.json({
      message: `Import completed. ${results.success} successful, ${results.failed} failed.`,
      results
    })
  } catch (error) {
    console.error('Error importing buyers:', error)
    
    // Handle authentication errors
    if (error instanceof Error && error.message.includes('User email not provided')) {
      return NextResponse.json(
        { error: 'Authentication required. Please login first.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to import buyers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
