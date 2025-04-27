import './globals.css'
import type { Metadata } from 'next'
import { AppProvider } from '@/utils/AppContext'
import AuthStatus from '@/components/AuthStatus'
import Providers from '@/components/Providers'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pathfinder App',
  description: 'An interactive pathfinding application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AppProvider>
            <div className="min-h-screen flex flex-col">
              <header className="bg-base-100 shadow-md py-2 px-4 border-b border-base-300 sticky top-0 z-30">
                <div className="container mx-auto flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="avatar placeholder">
                      <div className="bg-primary text-primary-content rounded-full w-10">
                        <span className="text-xl font-bold">PF</span>
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold text-primary">Pathfinding Project</h1>
                  </div>
                  <div className="flex items-center gap-4">
                    <nav className="hidden md:flex gap-4">
                      <Link href="/" className="btn btn-link text-primary no-underline hover:underline">Home</Link>
                      <Link href="/about" className="btn btn-link text-base-content no-underline hover:underline">About</Link>
                      <Link href="/documentation" className="btn btn-link text-base-content no-underline hover:underline">Documentation</Link>
                      <Link href="/admin" className="btn btn-link text-base-content no-underline hover:underline">Admin</Link>
                    </nav>
                    <AuthStatus />
                  </div>
                </div>
              </header>
              <main className="flex-grow">
        {children}
              </main>
            </div>
          </AppProvider>
        </Providers>
      </body>
    </html>
  )
}
