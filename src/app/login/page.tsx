// src/app/login/page.tsx - Fixed React unescaped entities
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-context'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading && user) {
      router.push('/buyers')
    }
  }, [user, loading, router])

  useEffect(() => {
    // Show success message from registration
    const message = searchParams?.get('message')
    if (message) {
      setError('') // Clear any existing error
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const result = await login(email, password)
    
    if (result.success) {
      router.push('/buyers')
    } else {
      setError(result.error || 'Login failed')
    }
    
    setIsLoading(false)
  }

  // Quick login function with auto-login
  const quickLogin = async (accountType: 'admin' | 'user') => {
    const accounts = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      user: { email: 'demo@example.com', password: 'demo123' }
    }
    
    const account = accounts[accountType]
    setEmail(account.email)
    setPassword(account.password)
    
    // Auto-submit after setting values
    setIsLoading(true)
    setError('')
    
    const result = await login(account.email, account.password)
    
    if (result.success) {
      router.push('/buyers')
    } else {
      setError(result.error || 'Login failed')
    }
    
    setIsLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  const successMessage = searchParams?.get('message')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Buyer Lead Intake CRM System
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {successMessage}
          </div>
        )}

        {/* Demo Account Cards - Fixed Padding */}
        <div className="space-y-2">
          <h3 className="text-xl font-medium text-gray-900 text-center">Quick Login</h3>
          
          <div className="space-y-4">
            {/* Admin Account Card - Enhanced Padding */}
            <div className="bg-white rounded-lg border-2 border-red-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👑</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">Admin Account</div>
                      <div className="text-xs text-gray-600 mt-1">admin@example.com</div>
                      <div className="text-xs text-red-600 mt-1">Full access + user management</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => quickLogin('admin')}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? 'Logging in...' : 'Quick Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* User Account Card - Enhanced Padding */}
            <div className="bg-white rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900">Demo User</div>
                      <div className="text-xs text-gray-600 mt-1">demo@example.com</div>
                      <div className="text-xs text-blue-600 mt-1">Can only edit own buyers</div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => quickLogin('user')}
                      disabled={isLoading}
                      className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {isLoading ? 'Logging in...' : 'Quick Login'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or Login Manually</span>
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm">{error}</div>
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-colors duration-200"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Registration Link - FIXED: Replaced apostrophe with &apos; */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link 
              href="/register" 
              className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-200"
            >
              Create one here
            </Link>
          </p>
        </div>

        {/* Demo Credentials Footer */}
        <div className="bg-gray-100 rounded-lg p-4 border">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700 mb-3">
              Demo Credentials
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <div className="flex items-center justify-center space-x-2 p-2 bg-white rounded">
                <span className="text-sm">👑</span>
                <span>Admin: admin@example.com / admin123</span>
              </div>
              <div className="flex items-center justify-center space-x-2 p-2 bg-white rounded">
                <span className="text-sm">👤</span>
                <span>User: demo@example.com / demo123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
