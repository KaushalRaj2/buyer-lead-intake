// src/app/layout.tsx - Fixed Hydration with suppressHydrationWarning
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/auth-context'
import { Navbar } from '@/components/layout/navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Buyer Lead Intake',
  description: 'Manage buyer leads efficiently',
  other: {
    'color-scheme': 'light only',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }} suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light" />
      </head>
      <body className={inter.className} style={{ colorScheme: 'light' }} suppressHydrationWarning>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
