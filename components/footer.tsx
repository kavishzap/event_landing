"use client"

import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Brand */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Image
                src="/images/new-20white-20logo.png"
                alt="Deloitte"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed mx-auto">
              Your platform for booking tickets to internal company events, team gatherings, and exclusive experiences. 
              Join your colleagues in discovering and participating in our internal events and activities.
            </p>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-8">
          <p className="text-sm text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Digital Factory Events. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
