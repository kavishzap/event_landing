"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"

export default function NotFound() {
  return (
    <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="text-center max-w-lg w-full"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="mb-6 flex flex-col items-center">
            <h1 className="text-9xl font-bold text-green-600 mb-4">404</h1>
          </div>
          <h2 className="text-4xl font-bold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground text-lg mb-2">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="text-sm text-muted-foreground/70">
            Please check the URL or return to the homepage.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex justify-center"
        >
          <Button 
            asChild 
            className="bg-green-600 hover:bg-green-700"
          >
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </main>
  )
}
