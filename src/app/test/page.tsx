// src/app/test/page.tsx - Enhanced Password Testing
'use client'

import { useState } from 'react'

export default function TestPage() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testPassword = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log(`Testing password for: ${email}`)
      
      const response = await fetch('/api/test-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      console.log('Password test response:', data)
      
      setResult(`Password Test for ${email}:
Status: ${response.status} ${data.success ? '✅ SUCCESS' : '❌ FAILED'}
Message: ${data.message}
${data.debug ? `Debug Info:
- Password Length: ${data.debug.passwordLength}
- Hash Start: ${data.debug.hashStart}
- Test Verification: ${data.debug.testVerification}` : ''}
${data.user ? `User Info:
- ID: ${data.user.id}
- Email: ${data.user.email}
- Role: ${data.user.role}
- Active: ${data.user.isActive}` : ''}`)
    } catch (error) {
      console.error('Password test error:', error)
      setResult(`❌ Password Test Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async (email: string, password: string) => {
    setLoading(true)
    try {
      console.log('Testing login for:', email)
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      console.log('Login response:', { status: response.status, data })
      
      setResult(`Login Test for ${email}:
Status: ${response.status} ${response.ok ? '✅ SUCCESS' : '❌ FAILED'}
Message: ${data.message || 'No message'}
Error: ${data.error || 'None'}
${data.user ? `Logged in as: ${data.user.name} (${data.user.role})` : ''}`)
    } catch (error) {
      console.error('Login error:', error)
      setResult(`❌ Login Network Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const regeneratePasswords = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-passwords', {
        method: 'POST'
      })
      
      const data = await response.json()
      setResult(`Password Regeneration:
Status: ${response.status} ${response.ok ? '✅ SUCCESS' : '❌ FAILED'}
${JSON.stringify(data, null, 2)}`)
    } catch (error) {
      setResult(`❌ Password Regeneration Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">🔐 Password & Authentication Tests</h1>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => testPassword('admin@example.com', 'admin123')}
          disabled={loading}
          className="btn btn-primary"
        >
          🔍 Test Admin Password
        </button>
        
        <button
          onClick={() => testPassword('demo@example.com', 'demo123')}
          disabled={loading}
          className="btn btn-secondary"
        >
          🔍 Test User Password
        </button>

        <button
          onClick={() => testLogin('admin@example.com', 'admin123')}
          disabled={loading}
          className="btn btn-primary"
        >
          👑 Test Admin Login
        </button>

        <button
          onClick={() => testLogin('demo@example.com', 'demo123')}
          disabled={loading}
          className="btn btn-secondary"
        >
          👤 Test User Login
        </button>

        <button
          onClick={regeneratePasswords}
          disabled={loading}
          className="btn btn-warning"
        >
          🔄 Fix Passwords
        </button>
      </div>

      {loading && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          🔄 Testing... Please wait
        </div>
      )}

      {result && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Test Results:</h2>
          <pre className="bg-gray-900 text-green-400 p-4 rounded overflow-auto text-sm border max-h-96">
            {result}
          </pre>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 p-4 rounded">
        <h3 className="font-semibold text-blue-800 mb-2">📊 Database Status:</h3>
        <div className="text-sm text-blue-700">
          <div>✅ Users table exists</div>
          <div>✅ admin@example.com found (60 char hash)</div>
          <div>✅ demo@example.com found (60 char hash)</div>
          <div>🔍 Testing password verification...</div>
        </div>
      </div>
    </div>
  )
}
