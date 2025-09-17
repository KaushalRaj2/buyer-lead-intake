// src/components/layout/navbar.tsx - Fixed Hydration Issues
'use client'

import { useAuth } from '@/components/auth/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function Navbar() {
    const { user, logout, loading } = useAuth()
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    // Don't render user-specific content until mounted
    if (!mounted || loading) {
        return (
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Buyer Lead Intake
                        </Link>
                        <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
            </nav>
        )
    }

    if (!user) {
        return (
            <nav className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="text-xl font-bold text-gray-900">
                            Buyer Lead Intake
                        </Link>
                        <Link href="/login" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors">
                            Login
                        </Link>
                    </div>
                </div>
            </nav>
        )
    }

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link href="/buyers" className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                        Buyer Lead Intake
                    </Link>

                    <div className="flex items-center space-x-3">
                        {/* Navigation Links - Minimal Style */}
                        <Link 
                            href="/buyers/new" 
                            className="px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        >
                            ➕ New Lead
                        </Link>
                        
                        <Link 
                            href="/buyers" 
                            className="px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        >
                            📋 View All
                        </Link>
                        
                        <Link
                            href="/import-export"
                            className="px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        >
                            📊 Import/Export
                        </Link>
                        
                        <Link 
                            href="/analytics" 
                            className="px-3 py-1.5 text-sm text-gray-700 hover:text-indigo-600 hover:bg-gray-50 rounded-md transition-colors duration-200"
                        >
                            📈 Analytics
                        </Link>

                        {/* Admin Link - Only for Admin Users */}
                        {user.role === 'admin' && (
                            <Link 
                                href="/admin" 
                                className="px-3 py-1.5 text-sm text-red-700 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors duration-200"
                            >
                                ⚙️ Admin
                            </Link>
                        )}

                        {/* User Info - Compact */}
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 rounded-md">
                            <span className={`px-2 py-0.5 text-xs rounded ${
                                user.role === 'admin' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-blue-100 text-blue-700'
                            }`}>
                                {user.role === 'admin' ? '👑' : '👤'}
                            </span>
                            <span className="text-sm text-gray-600 max-w-24 truncate">
                                {user.name || user.email}
                            </span>
                        </div>

                        {/* Logout Button - Minimal */}
                        <button 
                            onClick={handleLogout} 
                            className="px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
