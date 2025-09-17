// src/app/buyers/page.tsx - Clean Production Version
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

// Define enums and types at the top
enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

interface Buyer {
  id: string
  fullName: string
  email?: string
  phone: string
  city: string
  propertyType: string
  status: string
  updatedAt: string
  ownerId?: string
}

interface CurrentUser {
  id: string
  role: UserRole
}

export default function BuyersPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [buyers, setBuyers] = useState<Buyer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    city: '',
    status: '',
    propertyType: ''
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  // Get current user info
  const getCurrentUser = (): CurrentUser => {
    if (!user) {
      return { id: '', role: UserRole.USER }
    }
    
    return {
      id: user.id,
      role: user.role === 'admin' ? UserRole.ADMIN : UserRole.USER
    }
  }

  // Check if current user can edit this buyer
  const canEditBuyer = (buyer: Buyer): boolean => {
    if (!user) return false
    
    const currentUser = getCurrentUser()
    
    // Admin can edit all
    if (currentUser.role === UserRole.ADMIN) {
      return true
    }
    
    // Owner can edit their own
    if (buyer.ownerId === currentUser.id) {
      return true
    }
    
    return false
  }

  const fetchBuyers = async (): Promise<void> => {
    setIsLoading(true)
    setError('')
    
    try {
      // Filter empty values from filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value) acc[key] = value
        return acc
      }, {} as Record<string, string>)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...cleanFilters
      })
      
      const response = await fetch(`/api/buyers?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setBuyers(data.buyers || [])
        setPagination(prev => ({
          ...prev,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        }))
      } else {
        let errorMessage = 'Failed to fetch buyers'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = `Server error (${response.status})`
        }
        setError(errorMessage)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setError('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick status update function with ownership check
  const updateBuyerStatus = async (buyerId: string, newStatus: string): Promise<void> => {
    try {
      const buyerToUpdate = buyers.find(b => b.id === buyerId)
      if (!buyerToUpdate || !canEditBuyer(buyerToUpdate)) {
        alert('You do not have permission to update this buyer')
        return
      }

      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify({
          ...buyerToUpdate,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setBuyers(prev => prev.map(buyer => 
          buyer.id === buyerId 
            ? { ...buyer, status: newStatus, updatedAt: new Date().toISOString() }
            : buyer
        ))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Error updating status')
    }
  }

  // Delete buyer function with ownership check
  const deleteBuyer = async (buyerId: string): Promise<void> => {
    const buyerToDelete = buyers.find(b => b.id === buyerId)
    if (!buyerToDelete || !canEditBuyer(buyerToDelete)) {
      alert('You do not have permission to delete this buyer')
      return
    }

    if (!confirm('Are you sure you want to delete this buyer?')) return

    try {
      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        }
      })

      if (response.ok) {
        setBuyers(prev => prev.filter(buyer => buyer.id !== buyerId))
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete buyer')
      }
    } catch (error) {
      console.error('Error deleting buyer:', error)
      alert('Error deleting buyer')
    }
  }

  // Debounced search and filter effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        fetchBuyers()
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [user, search, filters, pagination.page])

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Clean Header - Removed debug info and buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Leads</h1>
          <p className="text-gray-600 mt-1">
            {pagination.total > 0 && `${pagination.total} total leads`}
          </p>
        </div>
        
        {/* Single primary action - other actions are in navbar drawer */}
        <Link href="/buyers/new" className="btn btn-primary">
          ➕ Add New Lead
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card p-4 border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex">
            <div className="text-yellow-800">
              <strong>Notice:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search buyers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <select
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="input"
            >
              <option value="">All Cities</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Mohali">Mohali</option>
              <option value="Zirakpur">Zirakpur</option>
              <option value="Panchkula">Panchkula</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Qualified">Qualified</option>
              <option value="Contacted">Contacted</option>
              <option value="Visited">Visited</option>
              <option value="Negotiation">Negotiation</option>
              <option value="Converted">Converted</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
          <div>
            <select
              value={filters.propertyType}
              onChange={(e) => setFilters(prev => ({ ...prev, propertyType: e.target.value }))}
              className="input"
            >
              <option value="">All Property Types</option>
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={fetchBuyers}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : '🔄 Refresh'}
          </button>
          
          <div className="flex gap-2">
            <button
              onClick={() => setFilters({ city: '', status: '', propertyType: '' })}
              className="btn btn-secondary"
            >
              Clear Filters
            </button>
            <button
              onClick={() => {
                setSearch('')
                setFilters({ city: '', status: '', propertyType: '' })
              }}
              className="btn btn-secondary"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-lg">Loading buyers...</div>
        </div>
      ) : buyers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-lg mb-4">
            {search || Object.values(filters).some(f => f) 
              ? 'No buyers match your search criteria' 
              : 'No buyers found'}
          </div>
          <Link href="/buyers/new" className="btn btn-primary">
            Add Your First Lead
          </Link>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Property Type</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Updated</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((buyer) => (
                  <tr key={buyer.id}>
                    <td>
                      <div className="font-medium text-gray-900">
                        {buyer.fullName}
                      </div>
                      {buyer.email && (
                        <div className="text-sm text-gray-500">{buyer.email}</div>
                      )}
                    </td>
                    <td>
                      <a href={`tel:${buyer.phone}`} className="text-indigo-600 hover:text-indigo-900">
                        {buyer.phone}
                      </a>
                    </td>
                    <td>{buyer.city}</td>
                    <td>{buyer.propertyType}</td>
                    <td>
                      <span className={`badge ${
                        buyer.status === 'New' 
                          ? 'badge-blue'
                          : buyer.status === 'Qualified'
                          ? 'badge-green'
                          : buyer.status === 'Contacted'
                          ? 'badge-yellow'
                          : buyer.status === 'Visited'
                          ? 'badge-purple'
                          : buyer.status === 'Negotiation'
                          ? 'badge-orange'
                          : buyer.status === 'Converted'
                          ? 'badge-green'
                          : 'badge-gray'
                      }`}>
                        {buyer.status}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {buyer.ownerId === getCurrentUser().id ? (
                        <span className="text-green-600">✓ Yours</span>
                      ) : user.role === 'admin' ? (
                        <span className="text-blue-600">👤 Other</span>
                      ) : (
                        <span className="text-gray-400">Other</span>
                      )}
                    </td>
                    <td className="text-gray-500">
                      {new Date(buyer.updatedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/buyers/${buyer.id}`}
                          className="text-indigo-600 hover:text-indigo-900 text-sm"
                        >
                          View
                        </Link>
                        {canEditBuyer(buyer) ? (
                          <>
                            <Link
                              href={`/buyers/${buyer.id}/edit`}
                              className="text-green-600 hover:text-green-900 text-sm"
                            >
                              Edit
                            </Link>
                            <button
                              onClick={() => deleteBuyer(buyer.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                            {buyer.status === 'New' && (
                              <button
                                onClick={() => updateBuyerStatus(buyer.id, 'Qualified')}
                                className="text-blue-600 hover:text-blue-900 text-sm"
                              >
                                Qualify
                              </button>
                            )}
                            {buyer.status === 'Qualified' && (
                              <button
                                onClick={() => updateBuyerStatus(buyer.id, 'Contacted')}
                                className="text-purple-600 hover:text-purple-900 text-sm"
                              >
                                Contact
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm">🔒</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Info */}
          <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-600">
            Showing {buyers.length} of {pagination.total} buyers
          </div>
        </div>
      )}
    </div>
  )
}
