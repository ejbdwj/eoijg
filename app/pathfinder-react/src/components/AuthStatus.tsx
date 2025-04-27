"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { signIn, signOut, useSession } from "next-auth/react"

export default function AuthStatus() {
  const { data: session, status } = useSession()
  const loading = status === "loading"
  const user = session?.user

  if (loading) {
    return <div className="loading loading-spinner loading-sm"></div>
  }

  if (!user) {
    return (
      <button 
        onClick={() => signIn(undefined, { callbackUrl: window.location.href })}
        className="btn btn-sm btn-primary"
      >
        Sign In
      </button>
    )
  }

  return (
    <div className="flex items-center gap-4">
      {user.name && <span className="text-sm hidden md:inline">Hello, {user.name}</span>}
      <div className="dropdown dropdown-end">
        <div tabIndex={0} className="avatar btn btn-ghost btn-circle">
          <div className="w-10 rounded-full">
            {user.image ? (
              <img src={user.image} alt={user.name || "User avatar"} />
            ) : (
              <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg">
                {user.name ? user.name[0].toUpperCase() : "U"}
              </div>
            )}
          </div>
        </div>
        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-2">
          <li>
            <Link href="/profile">Profile</Link>
          </li>
          {user.email?.endsWith("@admin.com") && (
            <li>
              <Link href="/admin">Admin Dashboard</Link>
            </li>
          )}
          <li>
            <button onClick={() => signOut({ callbackUrl: "/" })}>
              Sign Out
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
} 