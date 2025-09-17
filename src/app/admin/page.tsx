// src/app/admin/page.tsx - Fixed TypeScript Error Completely
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }
    if (!loading && user && user.role !== 'admin') {
      router.push('/buyers')
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers()
    }
  }, [user])

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // FIXED: Added explicit return type and return statement
  const fetchUsers = async (): Promise<void> => {
    setIsLoading(true)
    setError('')
    
    try {
      console.log('Fetching users with headers:', {
        'x-user-email': user?.email,
        'x-user-role': user?.role,
        'x-user-id': user?.id
      })
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        }
      })

      console.log('Fetch users response status:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('Users fetched successfully:', data)
        setUsers(data.users || [])
        setError('')
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch users:', errorData)
        setError(errorData.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Network error fetching users:', err)
      setError('Network error - failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: 'user' | 'admin'): Promise<void> => {
    setActionLoading(`role-${userId}`)
    setError('')
    
    try {
      console.log('Updating role for user:', userId, 'to:', newRole)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ role: newRole })
      })

      const responseData = await response.json()
      console.log('Update role response:', responseData)

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, role: newRole } : u
        ))
        setSuccessMessage(`User role updated to ${newRole}`)
      } else {
        setError(responseData.error || 'Failed to update user role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      setError('Network error - failed to update user role')
    } finally {
      setActionLoading(null)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean): Promise<void> => {
    setActionLoading(`status-${userId}`)
    setError('')
    
    try {
      console.log('Updating status for user:', userId, 'to:', isActive)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({ isActive })
      })

      const responseData = await response.json()
      console.log('Update status response:', responseData)

      if (response.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isActive } : u
        ))
        setSuccessMessage(`User ${isActive ? 'activated' : 'deactivated'} successfully`)
      } else {
        setError(responseData.error || 'Failed to update user status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      setError('Network error - failed to update user status')
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string): Promise<void> => {
    const userToDelete = users.find(u => u.id === userId)
    
    if (!confirm(`Are you sure you want to delete "${userToDelete?.name}"?\n\nThis will:\n• Delete the user account\n• Transfer their buyers to admin\n• This action cannot be undone`)) {
      return
    }

    setActionLoading(`delete-${userId}`)
    setError('')

    try {
      console.log('Deleting user:', userId)
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        }
      })

      const responseData = await response.json()
      console.log('Delete user response:', responseData)

      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        
        // Show success message with details
        if (responseData.transferredBuyers && responseData.transferredBuyers > 0) {
          setSuccessMessage(`User "${userToDelete?.name}" deleted successfully. ${responseData.transferredBuyers} buyers transferred to admin.`)
        } else {
          setSuccessMessage(`User "${userToDelete?.name}" deleted successfully.`)
        }
      } else {
        setError(responseData.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Network error - failed to delete user')
    } finally {
      setActionLoading(null)
    }
  }

  const refreshUsers = (): void => {
    setError('')
    setSuccessMessage('')
    fetchUsers()
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (user.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🚫</div>
        <div className="text-red-600 text-lg mb-4">Access Denied</div>
        <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
        <Link href="/buyers" className="btn btn-primary">
          Back to Buyers
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">
            Manage system users and their permissions
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/buyers" className="btn btn-secondary">
            ← Back to Buyers
          </Link>
          <Link href="/register" className="btn btn-primary">
            ➕ Add New User
          </Link>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="card p-4 border-l-4 border-green-400 bg-green-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-green-400 mr-2">✅</span>
              <div className="text-green-800">
                <strong>Success:</strong> {successMessage}
              </div>
            </div>
            <button 
              onClick={() => setSuccessMessage('')}
              className="text-green-600 hover:text-green-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card p-4 border-l-4 border-red-400 bg-red-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-red-400 mr-2">⚠️</span>
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={refreshUsers}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                Retry
              </button>
              <button 
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-blue-900">{users.length}</div>
              <div className="text-blue-700 text-sm">Total Users</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <span className="text-2xl">👑</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-red-900">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <div className="text-red-700 text-sm">Admin Users</div>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-green-50 border-green-200">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-green-900">
                {users.filter(u => u.isActive).length}
              </div>
              <div className="text-green-700 text-sm">Active Users</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
              <p className="text-gray-600 text-sm mt-1">
                Manage user roles, status, and permissions
              </p>
            </div>
            <button
              onClick={refreshUsers}
              disabled={isLoading}
              className="btn btn-secondary text-sm"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </span>
              ) : (
                '🔄 Refresh'
              )}
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <div className="text-lg mt-4 text-gray-600">Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">👥</span>
            <div className="text-lg text-gray-600 mb-4">No users found</div>
            <Link href="/register" className="btn btn-primary">
              Create First User
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th className="text-left">User</th>
                  <th className="text-left">Email</th>
                  <th className="text-left">Role</th>
                  <th className="text-left">Status</th>
                  <th className="text-left">Joined</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td>
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                          userItem.role === 'admin' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {userItem.role === 'admin' ? '👑' : '👤'}
                        </div>
                        <div className="ml-3">
                          <div className="font-medium text-gray-900">
                            {userItem.name}
                          </div>
                          {userItem.id === user.id && (
                            <div className="text-xs text-blue-600">Current User</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{userItem.email}</td>
                    <td>
                      <select
                        value={userItem.role}
                        onChange={(e) => updateUserRole(userItem.id, e.target.value as 'user' | 'admin')}
                        className="input text-sm py-1 px-2"
                        disabled={userItem.id === user.id || actionLoading === `role-${userItem.id}`}
                      >
                        <option value="user">👤 User</option>
                        <option value="admin">👑 Admin</option>
                      </select>
                      {actionLoading === `role-${userItem.id}` && (
                        <div className="text-xs text-gray-500 mt-1">Updating...</div>
                      )}
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userItem.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                          userItem.isActive ? 'bg-green-400' : 'bg-red-400'
                        }`}></span>
                        {userItem.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {new Date(userItem.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        {userItem.id !== user.id ? (
                          <>
                            <button
                              onClick={() => toggleUserStatus(userItem.id, !userItem.isActive)}
                              disabled={actionLoading === `status-${userItem.id}`}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                userItem.isActive 
                                  ? 'text-orange-700 bg-orange-100 hover:bg-orange-200' 
                                  : 'text-green-700 bg-green-100 hover:bg-green-200'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {actionLoading === `status-${userItem.id}` 
                                ? 'Updating...' 
                                : userItem.isActive ? 'Deactivate' : 'Activate'
                              }
                            </button>
                            <button
                              onClick={() => deleteUser(userItem.id)}
                              disabled={actionLoading === `delete-${userItem.id}`}
                              className="px-3 py-1 text-xs rounded-md text-red-700 bg-red-100 hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {actionLoading === `delete-${userItem.id}` ? 'Deleting...' : 'Delete'}
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs px-3 py-1">Current User</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {users.length > 0 && (
          <div className="p-4 border-t bg-gray-50 text-center">
            <div className="text-sm text-gray-600">
              Showing {users.length} total users
              {users.filter(u => u.isActive).length !== users.length && 
                ` • ${users.filter(u => u.isActive).length} active`
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
