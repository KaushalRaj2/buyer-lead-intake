// src/app/buyers/[id]/edit/page.tsx - Fixed for Next.js 15
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, use } from 'react'

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
}

export default function EditBuyerPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const resolvedParams = use(params) // Unwrap the Promise
  const [buyer, setBuyer] = useState<Buyer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: 'Chandigarh',
    propertyType: 'Apartment',
    bhk: '',
    purpose: 'Buy',
    budgetMin: '',
    budgetMax: '',
    timeline: '0-3m',
    source: 'Website',
    status: 'New',
    notes: '',
    tags: ''
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await fetch(`/api/buyers/${resolvedParams.id}`)
        if (response.ok) {
          const data = await response.json()
          setBuyer(data.buyer)
          // Populate form with existing data
          setFormData({
            fullName: data.buyer.fullName || '',
            email: data.buyer.email || '',
            phone: data.buyer.phone || '',
            city: data.buyer.city || 'Chandigarh',
            propertyType: data.buyer.propertyType || 'Apartment',
            bhk: data.buyer.bhk || '',
            purpose: data.buyer.purpose || 'Buy',
            budgetMin: data.buyer.budgetMin ? data.buyer.budgetMin.toString() : '',
            budgetMax: data.buyer.budgetMax ? data.buyer.budgetMax.toString() : '',
            timeline: data.buyer.timeline || '0-3m',
            source: data.buyer.source || 'Website',
            status: data.buyer.status || 'New',
            notes: data.buyer.notes || '',
            tags: Array.isArray(data.buyer.tags) ? data.buyer.tags.join(', ') : ''
          })
        } else {
          setError('Buyer not found')
        }
      } catch (err) {
        setError('Failed to load buyer')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && resolvedParams.id) {
      fetchBuyer()
    }
  }, [user, resolvedParams.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setValidationErrors({})

    try {
      // Client-side validation
      const errors: Record<string, string> = {}
      
      if (!formData.fullName || formData.fullName.length < 2) {
        errors.fullName = 'Name must be at least 2 characters'
      }
      
      if (!formData.phone || !/^\d{10,15}$/.test(formData.phone)) {
        errors.phone = 'Phone must be 10-15 digits'
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.email = 'Invalid email format'
      }
      
      if (['Apartment', 'Villa'].includes(formData.propertyType) && !formData.bhk) {
        errors.bhk = 'BHK is required for Apartment and Villa'
      }
      
      if (formData.budgetMin && formData.budgetMax) {
        const minBudget = parseInt(formData.budgetMin)
        const maxBudget = parseInt(formData.budgetMax)
        if (maxBudget < minBudget) {
          errors.budgetMax = 'Maximum budget must be greater than minimum budget'
        }
      }

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setError('Please fix the validation errors below')
        setIsSubmitting(false)
        return
      }

      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        city: formData.city,
        propertyType: formData.propertyType,
        bhk: formData.bhk || undefined,
        purpose: formData.purpose,
        budgetMin: formData.budgetMin ? parseInt(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? parseInt(formData.budgetMax) : undefined,
        timeline: formData.timeline,
        source: formData.source,
        status: formData.status,
        notes: formData.notes.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      }

      const response = await fetch(`/api/buyers/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (responseData.details && Array.isArray(responseData.details)) {
          // Zod validation errors
          const fieldErrors: Record<string, string> = {}
          responseData.details.forEach((detail: any) => {
            if (detail.path && detail.path.length > 0) {
              fieldErrors[detail.path[0]] = detail.message
            }
          })
          setValidationErrors(fieldErrors)
          setError('Please fix the validation errors below')
        } else {
          setError(responseData.error || 'Failed to update buyer')
        }
        return
      }

      router.push(`/buyers/${resolvedParams.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update buyer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  if (loading || isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (error && !buyer) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button onClick={() => router.push('/buyers')} className="btn btn-primary">
          Back to Buyers
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Buyer</h1>
          <p className="text-gray-600 mt-2">Update buyer information below.</p>
        </div>
        <button
          onClick={() => router.push(`/buyers/${resolvedParams.id}`)}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 card p-6">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-500 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            required
            value={formData.fullName}
            onChange={handleChange}
            className={`input ${validationErrors.fullName ? 'border-red-500' : ''}`}
          />
          {validationErrors.fullName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.fullName}</p>
          )}
        </div>

        {/* Email and Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-500 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input ${validationErrors.email ? 'border-red-500' : ''}`}
            />
            {validationErrors.email && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-500 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleChange}
              className={`input ${validationErrors.phone ? 'border-red-500' : ''}`}
            />
            {validationErrors.phone && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-500 mb-1">
            Status *
          </label>
          <select
            id="status"
            name="status"
            required
            value={formData.status}
            onChange={handleChange}
            className="input"
          >
            <option value="New">New</option>
            <option value="Qualified">Qualified</option>
            <option value="Contacted">Contacted</option>
            <option value="Visited">Visited</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Converted">Converted</option>
            <option value="Dropped">Dropped</option>
          </select>
        </div>

        {/* City and Property Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-500 mb-1">
              City *
            </label>
            <select
              id="city"
              name="city"
              required
              value={formData.city}
              onChange={handleChange}
              className="input"
            >
              <option value="Chandigarh">Chandigarh</option>
              <option value="Mohali">Mohali</option>
              <option value="Zirakpur">Zirakpur</option>
              <option value="Panchkula">Panchkula</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-gray-500 mb-1">
              Property Type *
            </label>
            <select
              id="propertyType"
              name="propertyType"
              required
              value={formData.propertyType}
              onChange={handleChange}
              className="input"
            >
              <option value="Apartment">Apartment</option>
              <option value="Villa">Villa</option>
              <option value="Plot">Plot</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
        </div>

        {/* BHK and Purpose */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Apartment', 'Villa'].includes(formData.propertyType) && (
            <div>
              <label htmlFor="bhk" className="block text-sm font-medium text-gray-500 mb-1">
                BHK *
              </label>
              <select
                id="bhk"
                name="bhk"
                required
                value={formData.bhk}
                onChange={handleChange}
                className={`input ${validationErrors.bhk ? 'border-red-500' : ''}`}
              >
                <option value="">Select BHK</option>
                <option value="1">1 BHK</option>
                <option value="2">2 BHK</option>
                <option value="3">3 BHK</option>
                <option value="4">4 BHK</option>
                <option value="Studio">Studio</option>
              </select>
              {validationErrors.bhk && (
                <p className="text-red-600 text-sm mt-1">{validationErrors.bhk}</p>
              )}
            </div>
          )}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-500 mb-1">
              Purpose *
            </label>
            <select
              id="purpose"
              name="purpose"
              required
              value={formData.purpose}
              onChange={handleChange}
              className="input"
            >
              <option value="Buy">Buy</option>
              <option value="Rent">Rent</option>
            </select>
          </div>
        </div>

        {/* Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="budgetMin" className="block text-sm font-medium text-gray-500 mb-1">
              Budget Min (₹)
            </label>
            <input
              type="number"
              id="budgetMin"
              name="budgetMin"
              value={formData.budgetMin}
              onChange={handleChange}
              className={`input ${validationErrors.budgetMin ? 'border-red-500' : ''}`}
            />
            {validationErrors.budgetMin && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.budgetMin}</p>
            )}
          </div>
          <div>
            <label htmlFor="budgetMax" className="block text-sm font-medium text-gray-500 mb-1">
              Budget Max (₹)
            </label>
            <input
              type="number"
              id="budgetMax"
              name="budgetMax"
              value={formData.budgetMax}
              onChange={handleChange}
              className={`input ${validationErrors.budgetMax ? 'border-red-500' : ''}`}
            />
            {validationErrors.budgetMax && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.budgetMax}</p>
            )}
          </div>
        </div>

        {/* Timeline and Source */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="timeline" className="block text-sm font-medium text-gray-500 mb-1">
              Timeline *
            </label>
            <select
              id="timeline"
              name="timeline"
              required
              value={formData.timeline}
              onChange={handleChange}
              className="input"
            >
              <option value="0-3m">0-3 months</option>
              <option value="3-6m">3-6 months</option>
              <option value=">6m">More than 6 months</option>
              <option value="Exploring">Just exploring</option>
            </select>
          </div>
          <div>
            <label htmlFor="source" className="block text-sm font-medium text-gray-500 mb-1">
              Source *
            </label>
            <select
              id="source"
              name="source"
              required
              value={formData.source}
              onChange={handleChange}
              className="input"
            >
              <option value="Website">Website</option>
              <option value="Referral">Referral</option>
              <option value="Walk-in">Walk-in</option>
              <option value="Call">Call</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-500 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="input"
            style={{ height: 'auto', minHeight: '100px' }}
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-500 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="input"
            placeholder="urgent, first-time-buyer, high-budget"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? 'Updating...' : 'Update Buyer'}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/buyers/${resolvedParams.id}`)}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
