// src/app/import-export/page.tsx - Clean Production Version
'use client'
import { useAuth } from '@/components/auth/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

export default function ImportExportPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/buyers/export', {
        headers: {
          'x-user-email': user?.email || '',
          'x-user-role': user?.role || 'user',
          'x-user-id': user?.id || ''
        }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        
        // Dynamic filename based on user role
        const userType = user?.role === 'admin' ? 'admin-all' : 'user-owned'
        a.download = `buyers-export-${userType}-${new Date().toISOString().split('T')[0]}.csv`
        
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to export buyers')
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Failed to export buyers')
    } finally {
      setIsExporting(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!selectedFile || !user) return

    setIsImporting(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await fetch('/api/buyers/import', {
        method: 'POST',
        headers: {
          'x-user-email': user.email,
          'x-user-role': user.role,
          'x-user-id': user.id
        },
        body: formData
      })

      const result = await response.json()
      
      if (response.ok) {
        setImportResult(result.results)
      } else {
        alert(result.error || 'Failed to import buyers')
      }
    } catch (error) {
      console.error('Import error:', error)
      alert('Failed to import buyers')
    } finally {
      setIsImporting(false)
    }
  }

  const generateSampleCSV = () => {
    const sampleCSV = `ID,Full Name,Email,Phone,City,Property Type,BHK,Purpose,Budget Min,Budget Max,Timeline,Source,Notes,Tags,Status
,John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,7000000,0-3m,Website,Looking for well-connected apartment,"urgent,first-time-buyer",New
,Jane Smith,jane@example.com,9876543211,Mohali,Villa,3,Buy,8000000,12000000,3-6m,Referral,Interested in independent villa,"qualified,high-budget",Qualified
,Raj Patel,,9876543212,Zirakpur,Plot,,Buy,3000000,5000000,>6m,Walk-in,Commercial plot for warehouse,commercial,Contacted
,Sarah Wilson,sarah@example.com,9876543213,Panchkula,Office,,Rent,50000,100000,0-3m,Call,Needs office space for startup,"commercial,urgent",New
,Mike Johnson,mike@example.com,9876543214,Chandigarh,Retail,,Buy,2000000,3000000,3-6m,Website,Looking for retail shop,"investment,commercial",Qualified`
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'buyers-import-template.csv'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Clean Header - Removed debug info */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Import & Export</h1>
            <p className="text-gray-600 mt-2">Manage your buyer data in bulk</p>
          </div>
          <Link href="/buyers" className="btn btn-secondary">
            ← Back to Buyers
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Export Section */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📤</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Export Buyers</h2>
              <p className="text-sm text-gray-500">
                {user.role === 'admin' ? 'Export all buyers in system' : 'Export your buyers only'}
              </p>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            Download your buyer leads as a CSV file for backup or external use.
          </p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Export includes:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Contact information (name, email, phone)</li>
                <li>• Property requirements and preferences</li>
                <li>• Lead status and timeline</li>
                <li>• Budget range and source</li>
                <li>• Notes and tags</li>
                <li>• Created/updated timestamps</li>
                {user.role === 'admin' && <li>• Owner information</li>}
              </ul>
            </div>
            
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="btn btn-primary w-full"
            >
              {isExporting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </span>
              ) : (
                '📥 Export to CSV'
              )}
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <span className="text-2xl mr-3">📥</span>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Buyers</h2>
              <p className="text-sm text-gray-500">Upload CSV to add multiple buyers</p>
            </div>
          </div>

          <p className="text-gray-600 mb-6">
            Upload a CSV file to import buyer leads in bulk. All imported buyers will be assigned to you.
          </p>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Required CSV Format:</h3>
              <p className="text-sm text-gray-600 mb-2">
                Your CSV must include these columns (in order):
              </p>
              <div className="bg-white p-2 rounded text-xs font-mono overflow-x-auto">
                ID, Full Name, Email, Phone, City, Property Type, BHK, Purpose, Budget Min, Budget Max, Timeline, Source, Notes, Tags, Status
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Leave ID column empty for new records
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select CSV File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="input"
              />
              {selectedFile && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-800">
                    📄 Selected: {selectedFile.name} 
                    <span className="text-green-600 ml-2">
                      ({Math.round(selectedFile.size / 1024)}KB)
                    </span>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleImport}
              disabled={!selectedFile || isImporting || !user}
              className="btn btn-primary w-full"
            >
              {isImporting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing...
                </span>
              ) : (
                '📤 Import CSV'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="mt-8 card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <span className="text-2xl text-green-600 mr-3">✅</span>
                <div>
                  <div className="text-2xl font-bold text-green-800">{importResult.success}</div>
                  <div className="text-green-600">Successfully Imported</div>
                </div>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <span className="text-2xl text-red-600 mr-3">❌</span>
                <div>
                  <div className="text-2xl font-bold text-red-800">{importResult.failed}</div>
                  <div className="text-red-600">Failed to Import</div>
                </div>
              </div>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Import Errors:</h3>
              <div className="bg-red-50 p-4 rounded-lg max-h-60 overflow-y-auto border border-red-200">
                <ul className="text-sm text-red-700 space-y-1">
                  {importResult.errors.map((error, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-500 mr-2">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/buyers" className="btn btn-primary">
              View All Buyers
            </Link>
            <button
              onClick={() => {
                setImportResult(null)
                setSelectedFile(null)
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
              }}
              className="btn btn-secondary"
            >
              Import More
            </button>
          </div>
        </div>
      )}

      {/* Sample CSV Template */}
      <div className="mt-8 card p-6">
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3">📋</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Sample CSV Template</h2>
            <p className="text-sm text-gray-500">Download a template with sample data</p>
          </div>
        </div>
        
        <p className="text-gray-600 mb-4">
          Download this sample template to see the correct format for importing buyers. It includes 5 sample records to help you get started.
        </p>
        
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
          <div className="flex">
            <span className="text-yellow-600 mr-2">💡</span>
            <div className="text-sm text-yellow-800">
              <strong>Tip:</strong> Leave the ID column empty for new records. The system will automatically generate unique IDs.
            </div>
          </div>
        </div>
        
        <button
          onClick={generateSampleCSV}
          className="btn btn-secondary"
        >
          📥 Download Sample Template
        </button>
      </div>
    </div>
  )
}
