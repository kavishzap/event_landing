"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home, Search } from "lucide-react"

export default function NotFound() {
  return (
    <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="mb-6">
          <h1 className="text-8xl font-bold text-green-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
          <p className="text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/events">
              <Search className="h-4 w-4 mr-2" />
              Browse Events
            </a>
          </Button>
        </div>
      </motion.div>
    </main>
  )
}
