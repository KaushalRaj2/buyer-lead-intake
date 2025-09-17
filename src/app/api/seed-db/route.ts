// src/app/api/seed-db/route.ts
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buyers } from '@/db/schema'

export async function POST() {
  try {
    const sampleBuyers = [
      {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: 5000000,
        budgetMax: 7000000,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        notes: 'Looking for a well-connected apartment with good amenities.',
        tags: ['urgent', 'first-time-buyer'],
        ownerId: 'demo-user-1',
        status: 'New' as const
      },
      {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        phone: '9876543211',
        city: 'Mohali' as const,
        propertyType: 'Villa' as const,
        bhk: '3' as const,
        purpose: 'Buy' as const,
        budgetMin: 8000000,
        budgetMax: 12000000,
        timeline: '3-6m' as const,
        source: 'Referral' as const,
        notes: 'Interested in independent villas with parking space.',
        tags: ['qualified', 'high-budget'],
        ownerId: 'demo-user-1',
        status: 'Qualified' as const
      },
      {
        fullName: 'Raj Patel',
        phone: '9876543212',
        city: 'Zirakpur' as const,
        propertyType: 'Plot' as const,
        purpose: 'Buy' as const,
        budgetMin: 3000000,
        budgetMax: 5000000,
        timeline: '>6m' as const,
        source: 'Walk-in' as const,
        notes: 'Looking for commercial plot for warehouse.',
        tags: ['commercial'],
        ownerId: 'demo-user-1',
        status: 'Contacted' as const
      }
    ]

    const result = await db.insert(buyers).values(sampleBuyers).returning()

    return NextResponse.json({
      message: 'Sample data inserted successfully',
      insertedBuyers: result
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json({
      error: 'Failed to seed database',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
