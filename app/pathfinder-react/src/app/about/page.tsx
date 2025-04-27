"use client"

import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-base-200 min-h-screen">
      {/* Hero Section */}
      <div className="hero min-h-[40vh] bg-base-300">
        <div className="hero-content text-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-bold">About Pathfinding Project</h1>
            <p className="py-6 text-lg">
              Exploring modern pathfinding algorithms through interactive maps and visualizations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Left Column - Mission */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Our Mission</h2>
              <p className="mb-4">
                The Pathfinding Project aims to create an interactive platform for exploring, visualizing, and understanding
                different pathfinding algorithms on real-world maps. We believe that through visualization, complex
                algorithms become more accessible and intuitive.
              </p>
              <p>
                Whether you're a student, researcher, or industry professional, our tools help you understand the nuances
                of different algorithms and how they perform in various scenarios.
              </p>
            </div>
          </div>

          {/* Right Column - Features */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-2xl mb-4">Key Features</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Interactive 3D map visualization</li>
                <li>Multiple floor level navigation</li>
                <li>Customizable visual appearance</li>
                <li>Event management and display</li>
                <li>Real-time pathfinding visualization</li>
                <li>Comparative algorithm analysis</li>
                <li>Support for various map data formats</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <h2 className="text-3xl font-bold text-center mb-8">Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Team Member 1 */}
          <div className="card bg-base-100 shadow-xl">
            <figure className="px-10 pt-10">
              <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-24">
                  <span className="text-3xl">JD</span>
                </div>
              </div>
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">Jane Doe</h2>
              <p className="text-sm opacity-70">Lead Developer</p>
              <p className="mt-2">Specializes in algorithm optimization and 3D map rendering.</p>
            </div>
          </div>

          {/* Team Member 2 */}
          <div className="card bg-base-100 shadow-xl">
            <figure className="px-10 pt-10">
              <div className="avatar placeholder">
                <div className="bg-primary text-primary-content rounded-full w-24">
                  <span className="text-3xl">JS</span>
                </div>
              </div>
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">John Smith</h2>
              <p className="text-sm opacity-70">Data Scientist</p>
              <p className="mt-2">Works on algorithm analysis and performance benchmarking.</p>
            </div>
          </div>

          {/* Team Member 3 */}
          <div className="card bg-base-100 shadow-xl">
            <figure className="px-10 pt-10">
              <div className="avatar placeholder">
                <div className="bg-secondary text-secondary-content rounded-full w-24">
                  <span className="text-3xl">AW</span>
                </div>
              </div>
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">Alice Williams</h2>
              <p className="text-sm opacity-70">UI/UX Designer</p>
              <p className="mt-2">Creates intuitive interfaces and visualizations for complex data.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4 text-center">Ready to explore pathfinding?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/" className="btn btn-primary">
              Go to Map
            </Link>
            <Link href="/documentation" className="btn btn-outline">
              Read Documentation
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content">
        <div>
          <p>© 2024 Pathfinding Project - All rights reserved</p>
        </div>
      </footer>
    </div>
  );
} 