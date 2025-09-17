// src/app/buyers/new/page.tsx - Clean Production Version
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function NewBuyerPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
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
    notes: '',
    tags: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setValidationErrors({})

    try {
      // Ensure we have user data
      if (!user) {
        setError('User not authenticated')
        setIsSubmitting(false)
        return
      }

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

      // Prepare payload
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
        notes: formData.notes.trim() || undefined,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      }

      // Send request with user headers
      const response = await fetch('/api/buyers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': user.email,
          'x-user-role': user.role,
          'x-user-id': user.id
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
          setError(responseData.error || 'Failed to create buyer')
        }
        return
      }

      // Success - redirect to buyers list
      router.push('/buyers')
    } catch (err) {
      console.error('Error creating buyer:', err)
      setError(err instanceof Error ? err.message : 'Failed to create buyer')
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

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Clean Header - Removed debug info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Buyer Lead</h1>
        <p className="text-gray-600 mt-2">Enter the buyer information below.</p>
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
            placeholder="Enter full name"
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
              placeholder="Enter email"
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
              placeholder="Enter 10-15 digits"
            />
            {validationErrors.phone && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>
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
              placeholder="Minimum budget"
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
              placeholder="Maximum budget"
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
            placeholder="Additional notes about the buyer..."
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

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary flex-1"
          >
            {isSubmitting ? 'Creating Lead...' : 'Create Lead'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/buyers')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
