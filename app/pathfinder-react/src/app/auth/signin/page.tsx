"use client"

import { signIn } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  
  // Check for error in the URL
  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam) {
      switch (errorParam) {
        case "OAuthAccountNotLinked":
          setError("This email is already associated with another provider. Please sign in with the provider you used originally.")
          break
        case "OAuthSignin":
        case "OAuthCallback":
          setError("There was a problem with the OAuth authentication. Please try again.")
          break
        case "AccessDenied":
          setError("You do not have permission to sign in.")
          break
        default:
          setError("An error occurred during sign in. Please try again.")
      }
    }
  }, [searchParams])

  const handleSignIn = async (provider: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Get the callbackUrl from the URL or default to '/'
      const callbackUrl = searchParams.get("callbackUrl") || "/"
      
      // Redirect to provider sign-in page
      await signIn(provider, { callbackUrl })
    } catch (err) {
      console.error("Sign in error:", err)
      setError("Failed to start sign in process. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title text-2xl mb-6">Sign In</h2>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex flex-col w-full gap-3">
            <button 
              className="btn btn-primary" 
              onClick={() => handleSignIn('google')}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : null}
              Sign in with Google
            </button>
          </div>
          
          <div className="mt-6">
            <Link href="/" className="link link-hover">
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 