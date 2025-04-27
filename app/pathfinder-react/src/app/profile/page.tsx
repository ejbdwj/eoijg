"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useState } from "react"
import { Sketch } from "@uiw/react-color"
import { useAppContext, VisualizationSettings } from "@/utils/AppContext"

interface User {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Session {
  user: User
  expires: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const loading = status === "loading"
  const { visualSettings, updateVisualSettings } = useAppContext()
  const [openColorPicker, setOpenColorPicker] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Handle color change
  const handleColorChange = (element: keyof VisualizationSettings['colors'], color: string) => {
    updateVisualSettings({
      colors: {
        [element]: color
      }
    });
  };

  // Handle visibility change
  const handleVisibilityChange = (setting: keyof VisualizationSettings['defaultVisibility'], value: boolean) => {
    updateVisualSettings({
      defaultVisibility: {
        [setting]: value
      }
    });
  };

  // Save settings
  const saveSettings = () => {
    // Display success message
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-2xl mb-6">Not Signed In</h2>
            <p className="mb-6">Please sign in to view your profile.</p>
            <Link href="/auth/signin" className="btn btn-primary">Sign In</Link>
          </div>
        </div>
      </div>
    )
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-base-200 py-12">
      <div className="max-w-4xl mx-auto">
        {showSuccess && (
          <div className="alert alert-success mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Settings saved successfully!</span>
          </div>
        )}

        {/* Profile Information Card */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Your Profile</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              <div className="avatar">
                <div className="w-32 h-32 rounded-full">
                  {user.image ? (
                    <img src={user.image} alt={user.name || "User avatar"} />
                  ) : (
                    <div className="bg-primary text-primary-content flex items-center justify-center h-full text-4xl">
                      {user.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input 
                    type="text" 
                    value={user.name || ''} 
                    className="input input-bordered" 
                    disabled 
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input 
                    type="text" 
                    value={user.email || ''} 
                    className="input input-bordered" 
                    disabled 
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Session Expires</span>
                  </label>
                  <input 
                    type="text" 
                    value={new Date(session.expires).toLocaleString()} 
                    className="input input-bordered" 
                    disabled 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Settings Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Map Visualization Settings</h2>
            
            <div className="divider">Color Settings</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Controls */}
              {Object.entries(visualSettings.colors).map(([element, color]) => (
                <div className="form-control" key={element}>
                  <label className="label">
                    <span className="label-text capitalize">{element.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <div 
                        className={`w-12 h-8 cursor-pointer border border-base-300 rounded flex items-center justify-center group transition-all duration-200 ${openColorPicker === element ? 'ring ring-primary ring-offset-2' : ''}`}
                        style={{ 
                          backgroundColor: color, 
                          boxShadow: openColorPicker === element ? 'inset 0 0 0 1000px rgba(0,0,0,0.3)' : 'none' 
                        }}
                        onClick={() => setOpenColorPicker(openColorPicker === element ? null : element)}
                      >
                        <div className={`absolute inset-0 rounded flex items-center justify-center ${openColorPicker === element ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100 bg-black/20'}`}>
                          {openColorPicker === element ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                              <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5 text-white stroke-[2px]">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          )}
                        </div>
                      </div>
                      {openColorPicker === element && (
                        <div className="absolute z-50 mt-2 card card-compact shadow-lg bg-base-100">
                          <div className="card-body p-1">
                            <Sketch
                              color={color}
                              onChange={(color) => {
                                handleColorChange(element as keyof VisualizationSettings['colors'], color.hex);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={color}
                      onChange={(e) => handleColorChange(element as keyof VisualizationSettings['colors'], e.target.value)}
                      className="input input-bordered w-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="divider">Default Visibility</div>

            {/* Default Visibility Settings */}
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Show Service Paths by Default</span>
                <input 
                  type="checkbox" 
                  checked={visualSettings.defaultVisibility.showServicePaths}
                  onChange={(e) => handleVisibilityChange('showServicePaths', e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer">
                <span className="label-text">Show Utilities by Default</span>
                <input 
                  type="checkbox" 
                  checked={visualSettings.defaultVisibility.showUtilities}
                  onChange={(e) => handleVisibilityChange('showUtilities', e.target.checked)}
                  className="checkbox checkbox-primary"
                />
              </label>
            </div>

            <div className="card-actions justify-end mt-6">
              <button id="save-settings-button" className="btn btn-primary" onClick={saveSettings}>Save Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 