"use client"

import { signOut } from "next-auth/react"
import { useState } from "react"
import Link from "next/link"

export default function SignOutPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    await signOut({ callbackUrl: '/' })
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl mb-6">Sign Out</h2>
          
          <p className="mb-6">Are you sure you want to sign out?</p>
          
          <div className="flex flex-col w-full gap-3">
            <button 
              className="btn btn-primary" 
              onClick={handleSignOut}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : null}
              Sign Out
            </button>
            
            <Link href="/" className="btn btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 