// src/app/analytics/page.tsx
'use client'

import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface AnalyticsData {
  totalBuyers: number
  statusBreakdown: Record<string, number>
  cityBreakdown: Record<string, number>
  propertyTypeBreakdown: Record<string, number>
  sourceBreakdown: Record<string, number>
  recentBuyers: number
  conversionRate: number
}

export default function AnalyticsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/buyers?limit=1000')
        if (response.ok) {
          const data = await response.json()
          const buyers = data.buyers || []
          
          // Calculate analytics
          const statusBreakdown: Record<string, number> = {}
          const cityBreakdown: Record<string, number> = {}
          const propertyTypeBreakdown: Record<string, number> = {}
          const sourceBreakdown: Record<string, number> = {}
          
          buyers.forEach((buyer: any) => {
            statusBreakdown[buyer.status] = (statusBreakdown[buyer.status] || 0) + 1
            cityBreakdown[buyer.city] = (cityBreakdown[buyer.city] || 0) + 1
            propertyTypeBreakdown[buyer.propertyType] = (propertyTypeBreakdown[buyer.propertyType] || 0) + 1
            sourceBreakdown[buyer.source] = (sourceBreakdown[buyer.source] || 0) + 1
          })
          
          const recentBuyers = buyers.filter((buyer: any) => {
            const buyerDate = new Date(buyer.createdAt)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return buyerDate >= weekAgo
          }).length
          
          const convertedBuyers = statusBreakdown['Converted'] || 0
          const conversionRate = buyers.length > 0 ? (convertedBuyers / buyers.length) * 100 : 0
          
          setAnalytics({
            totalBuyers: buyers.length,
            statusBreakdown,
            cityBreakdown,
            propertyTypeBreakdown,
            sourceBreakdown,
            recentBuyers,
            conversionRate
          })
        }
      } catch (error) {
        console.error('Error fetching analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchAnalytics()
    }
  }, [user])

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
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your buyer leads performance</p>
        </div>
        <Link href="/buyers" className="btn btn-secondary">
          ← Back to Buyers
        </Link>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-blue-600">{analytics.totalBuyers}</div>
              <div className="text-gray-600">Total Buyers</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-green-600">{analytics.recentBuyers}</div>
              <div className="text-gray-600">New This Week</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {analytics.conversionRate.toFixed(1)}%
              </div>
              <div className="text-gray-600">Conversion Rate</div>
            </div>
            <div className="card p-6 text-center">
              <div className="text-3xl font-bold text-orange-600">
                {analytics.statusBreakdown['Converted'] || 0}
              </div>
              <div className="text-gray-600">Converted</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Status Breakdown</h2>
              <div className="space-y-3">
                {Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-700">{status}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalBuyers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* City Breakdown */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">City Distribution</h2>
              <div className="space-y-3">
                {Object.entries(analytics.cityBreakdown).map(([city, count]) => (
                  <div key={city} className="flex justify-between items-center">
                    <span className="text-gray-700">{city}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalBuyers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Property Type Breakdown */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Types</h2>
              <div className="space-y-3">
                {Object.entries(analytics.propertyTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalBuyers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="card p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Sources</h2>
              <div className="space-y-3">
                {Object.entries(analytics.sourceBreakdown).map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-gray-700">{source}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${(count / analytics.totalBuyers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-900 font-medium w-8">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
