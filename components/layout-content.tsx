"use client"

import type React from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hideHeader = pathname === "/login" || pathname === "/register"

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <>
      {!hideHeader && <Header />}
      {children}
      <Footer />
    </>
  )
}
