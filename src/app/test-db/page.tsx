// Create src/app/test-db/page.tsx to test the database
'use client'

import { useState } from 'react'

export default function TestDBPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      setResult(`${email}: ${response.ok ? 'SUCCESS' : 'FAILED'}\n${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Database Test</h1>
      
      <div className="space-x-4 mb-4">
        <button
          onClick={() => testLogin('admin@example.com', 'admin123')}
          disabled={loading}
          className="btn btn-primary"
        >
          Test Admin Login
        </button>
        
        <button
          onClick={() => testLogin('demo@example.com', 'demo123')}
          disabled={loading}
          className="btn btn-secondary"
        >
          Test User Login
        </button>
      </div>

      {result && (
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {result}
        </pre>
      )}
    </div>
  )
}
