import './globals.css'
import type { Metadata } from 'next'
import { AppProvider } from '@/utils/AppContext'
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
    <html lang="en" data-theme="imageInspiredDark">
      <body>
          <AppProvider>
            <div className="drawer lg:drawer-open">
              <div className="flex flex-col min-h-screen drawer-content">
                <header className="sticky top-0 z-30 px-2 h-12 border-b shadow-md bg-base-100 border-base-300">
                  <div className="flex items-center h-full">
                    <div className="flex items-center lg:hidden">
                      <span className="ml-2 text-lg font-semibold">NUSH Pathfinder</span>
                    </div>
                    <Link href="/" className="hidden text-xl normal-case btn btn-ghost lg:flex">NUSH Pathfinder</Link>
                  </div>
                </header>
                <main className="flex-grow p-0">
                  {children}
                </main>
              </div>
            </div>
          </AppProvider>
      </body>
    </html>
  )
}
