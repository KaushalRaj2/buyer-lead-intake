// src/app/api/test-ownership/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const testUser1 = { id: 'user-1', role: 'user' }
  const testUser2 = { id: 'user-2', role: 'user' }  
  const testAdmin = { id: 'admin-1', role: 'admin' }
  
  return NextResponse.json({
    message: 'Ownership test endpoint',
    users: {
      user1: testUser1,
      user2: testUser2,
      admin: testAdmin
    },
    instructions: {
      create: 'Creates buyers with current user as owner',
      read: 'Anyone can read all buyers',
      update: 'Only owner or admin can update',
      delete: 'Only owner or admin can delete'
    }
  })
}
