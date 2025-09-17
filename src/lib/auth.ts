// src/lib/auth.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export interface User {
  id: string
  email: string
  name?: string
}

// Simple demo authentication
export const demoUsers = [
  { id: '1', email: 'demo@example.com', password: 'demo123', name: 'Demo User' },
  { id: '2', email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
]

export async function loginUser(email: string, password: string): Promise<User | null> {
  // Simple demo login - replace with real auth
  const user = demoUsers.find(u => u.email === email && u.password === password)
  if (user) {
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }
  return null
}

export async function getCurrentUser(): Promise<User | null> {
  // Check if user is logged in (demo implementation)
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('currentUser')
    return userStr ? JSON.parse(userStr) : null
  }
  return null
}

export async function logoutUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('currentUser')
  }
}
