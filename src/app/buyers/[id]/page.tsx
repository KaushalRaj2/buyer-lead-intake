// src/app/buyers/[id]/page.tsx - Fixed for Next.js 15
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'
import Link from 'next/link'

interface Buyer {
  id: string
  fullName: string
  email?: string
  phone: string
  city: string
  propertyType: string
  bhk?: string
  purpose: string
  budgetMin?: number
  budgetMax?: number
  timeline: string
  source: string
  status: string
  notes?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface BuyerHistoryRecord {
  id: string
  buyerId: string
  changedBy: string
  changedAt: string
  diff: any
}

export default function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params) // Unwrap the Promise
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [history, setHistory] = useState<BuyerHistoryRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadBuyer = async () => {
      setIsLoading(true)
      setError('')
      
      try {
        console.log('Fetching buyer with ID:', resolvedParams.id)
        
        const response = await fetch(`/api/buyers/${resolvedParams.id}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Buyer data received:', data)
          setBuyer(data.buyer)
          setHistory(data.history || [])
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Failed to load buyer')
        }
      } catch (err) {
        console.error('Error fetching buyer:', err)
        setError('Network error - failed to load buyer')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && resolvedParams.id) {
      loadBuyer()
    }
  }, [user, resolvedParams.id])

  // Quick status update function
  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/buyers/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...buyer,
          status: newStatus,
        }),
      })

      if (response.ok) {
        const updatedBuyer = await response.json()
        setBuyer(updatedBuyer)
      }
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">Loading buyer details...</div>
      </div>
    )
  }

  if (error || !buyer) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error || 'Buyer not found'}</div>
        <Link href="/buyers" className="btn btn-primary">
          Back to Buyers
        </Link>
      </div>
    )
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{buyer.fullName}</h1>
          <p className="text-gray-600 mt-2">Lead Details</p>
        </div>
        <div className="flex gap-4">
          <Link href={`/buyers/${buyer.id}/edit`} className="btn btn-secondary">
            ✏️ Edit
          </Link>
          <Link href="/buyers" className="btn btn-secondary">
            ← Back to List
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-sm text-gray-900">{buyer.fullName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1 text-sm text-gray-900">
                  <a href={`tel:${buyer.phone}`} className="text-indigo-600 hover:text-indigo-900">
                    {buyer.phone}
                  </a>
                </p>
              </div>
              {buyer.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">
                    <a href={`mailto:${buyer.email}`} className="text-indigo-600 hover:text-indigo-900">
                      {buyer.email}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">City</label>
                <p className="mt-1 text-sm text-gray-900">{buyer.city}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Property Type</label>
                <p className="mt-1 text-sm text-gray-900">{buyer.propertyType}</p>
              </div>
              {buyer.bhk && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">BHK</label>
                  <p className="mt-1 text-sm text-gray-900">{buyer.bhk} BHK</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Purpose</label>
                <p className="mt-1 text-sm text-gray-900">{buyer.purpose}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Timeline</label>
                <p className="mt-1 text-sm text-gray-900">
                  {buyer.timeline === '0-3m' && '0-3 months'}
                  {buyer.timeline === '3-6m' && '3-6 months'}
                  {buyer.timeline === '>6m' && 'More than 6 months'}
                  {buyer.timeline === 'Exploring' && 'Just exploring'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Budget Range</label>
                <p className="mt-1 text-sm text-gray-900">
                  {formatCurrency(buyer.budgetMin)} - {formatCurrency(buyer.budgetMax)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Source</label>
                <p className="mt-1 text-sm text-gray-900">{buyer.source}</p>
              </div>
            </div>
          </div>

          {buyer.notes && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Notes</h2>
              <p className="text-sm text-gray-700">{buyer.notes}</p>
            </div>
          )}

          {/* Activity History */}
          {history && history.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Activity History</h2>
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="border-l-4 border-blue-200 pl-4 pb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.diff?.action || 'Updated'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(item.changedAt)} by {item.changedBy}
                        </p>
                      </div>
                    </div>
                    {item.diff?.changes && (
                      <div className="mt-2 text-xs text-gray-600">
                        {Object.entries(item.diff.changes).map(([field, change]: [string, any]) => (
                          <div key={field}>
                            <span className="font-medium">{field}:</span> {change.from} → {change.to}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Current Status</label>
                <span className={`inline-flex mt-1 px-3 py-1 text-xs font-semibold rounded-full ${
                  buyer.status === 'New' 
                    ? 'bg-blue-100 text-blue-800'
                    : buyer.status === 'Qualified'
                    ? 'bg-green-100 text-green-800'
                    : buyer.status === 'Contacted'
                    ? 'bg-yellow-100 text-yellow-800'
                    : buyer.status === 'Visited'
                    ? 'bg-purple-100 text-purple-800'
                    : buyer.status === 'Negotiation'
                    ? 'bg-orange-100 text-orange-800'
                    : buyer.status === 'Converted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {buyer.status}
                </span>
              </div>
              
              {/* Quick Status Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Quick Actions</label>
                <div className="space-y-2">
                  {buyer.status === 'New' && (
                    <button
                      onClick={() => updateStatus('Qualified')}
                      className="btn btn-secondary w-full text-sm"
                    >
                      Mark as Qualified
                    </button>
                  )}
                  {buyer.status === 'Qualified' && (
                    <button
                      onClick={() => updateStatus('Contacted')}
                      className="btn btn-secondary w-full text-sm"
                    >
                      Mark as Contacted
                    </button>
                  )}
                  {buyer.status === 'Contacted' && (
                    <button
                      onClick={() => updateStatus('Visited')}
                      className="btn btn-secondary w-full text-sm"
                    >
                      Mark as Visited
                    </button>
                  )}
                  {['Visited', 'Negotiation'].includes(buyer.status) && (
                    <button
                      onClick={() => updateStatus('Converted')}
                      className="btn btn-primary w-full text-sm"
                    >
                      Mark as Converted
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(buyer.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(buyer.updatedAt)}</p>
              </div>
            </div>
          </div>

          {buyer.tags && buyer.tags.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {buyer.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
