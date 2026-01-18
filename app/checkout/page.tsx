"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { formatDate, formatTime, formatPrice, generateTicketCode, generateQRCode } from "@/lib/utils-booking"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import type { Event, SelectedTier } from "@/lib/types"
import { createEnrollment, canEnroll, updateProfile } from "@/lib/supabase/api"
import Image from "next/image"
import { Calendar, Clock, MapPin } from "lucide-react"

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutContent />
    </ProtectedRoute>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const { session, profile } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Form data
  const [name, setName] = useState(session?.name || "")
  const [email, setEmail] = useState(session?.email || "")
  const [phone, setPhone] = useState(profile?.phone || "")

  // Checkout data from session storage
  const [checkoutData, setCheckoutData] = useState<{
    event: Event & { eventId?: string }
    eventId?: string
    selectedTiers: SelectedTier[]
    totals: { subtotal: number; fees: number; total: number }
  } | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem("checkout-data")
    if (stored) {
      setCheckoutData(JSON.parse(stored))
    } else {
      router.push("/")
    }
  }, [router])

  // Update phone when profile loads
  useEffect(() => {
    if (profile?.phone && !phone) {
      setPhone(profile.phone)
    }
  }, [profile?.phone])

  if (!checkoutData) {
    return null
  }

  const { event, selectedTiers, totals } = checkoutData

  const handleConfirm = async () => {
    if (!session || !checkoutData?.eventId) {
      toast({
        title: "Error",
        description: "Missing session or event information.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Calculate total quantity
      const totalQuantity = selectedTiers.reduce((sum, tier) => sum + tier.qty, 0)

      // Check capacity
      const canBook = await canEnroll(checkoutData.eventId, totalQuantity)
      if (!canBook) {
        toast({
          title: "Not enough tickets available",
          description: "The event has reached capacity. Please select fewer tickets.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      // Update profile if phone number provided
      if (phone && session.userId) {
        await updateProfile(session.userId, { phone })
      }

      // Create enrollment for each tier (or combine into one)
      // For simplicity, we'll create one enrollment with total quantity
      // In a more complex system, you might want separate enrollments per tier
      const enrollment = await createEnrollment(checkoutData.eventId, session.userId, totalQuantity)

      if (!enrollment) {
        throw new Error("Failed to create enrollment")
      }

      // Clear session storage
      sessionStorage.removeItem("checkout-data")

      toast({
        title: "Booking Confirmed!",
        description: "Your tickets have been booked successfully.",
      })

      router.push("/my-tickets")
    } catch (error) {
      console.error("Error creating enrollment:", error)
      toast({
        title: "Booking Failed",
        description: "There was an error processing your booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">Checkout</h1>
            <p className="text-muted-foreground">Complete your booking in a few simple steps</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Details Card */}
              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-48 sm:h-auto">
                      <Image
                        src={event.coverImage || "/placeholder.jpg"}
                        alt={event.title}
                        fill
                        className="object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-t-none"
                      />
                    </div>
                    <div className="flex-1 p-4 sm:p-6">
                      <h2 className="text-xl sm:text-2xl font-bold mb-4">{event.title}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Date</p>
                            <p className="font-semibold text-sm sm:text-base">{formatDate(event.date)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Clock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Time</p>
                            <p className="font-semibold text-sm sm:text-base">{formatTime(event.time)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 sm:col-span-2">
                          <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Location</p>
                            <p className="font-semibold text-sm sm:text-base">{event.location}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Checkout Steps */}
              {/* Step 1: Details */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Contact Information</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please provide your contact details for ticket delivery
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">
                            Full Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            className="h-11"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Email Address <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="john@example.com"
                            className="h-11"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Phone Number <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            className="h-11"
                            required
                          />
                          <p className="text-xs text-muted-foreground">
                            We'll use this to send you important updates about your booking
                          </p>
                        </div>

                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 h-11 text-base font-medium"
                          onClick={() => setStep(2)}
                          disabled={!name || !email || !phone}
                        >
                          Continue to Review
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Confirm */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Review Your Booking</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please review your details before confirming
                        </p>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Contact Details */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-base">Contact Details</h3>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-green-600 text-sm" 
                              onClick={() => setStep(1)}
                            >
                              Edit
                            </Button>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Name</span>
                              <span className="text-sm font-medium">{name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Email</span>
                              <span className="text-sm font-medium">{email}</span>
                            </div>
                            {phone && (
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Phone</span>
                                <span className="text-sm font-medium">{phone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Event Details */}
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="font-semibold text-base">Event Details</h3>
                          <div className="flex items-start gap-4 bg-muted/50 rounded-lg p-4">
                            <div className="relative w-16 h-16 flex-shrink-0">
                              <Image
                                src={event.coverImage || "/placeholder.jpg"}
                                alt={event.title}
                                fill
                                className="object-cover rounded-lg"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base mb-2 truncate">{event.title}</p>
                              <div className="space-y-1.5 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <span>{formatDate(event.date)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 flex-shrink-0" />
                                  <span>{formatTime(event.time)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 flex-shrink-0" />
                                  <span className="break-words">{event.location}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tickets */}
                        <div className="space-y-3 pt-4 border-t">
                          <h3 className="font-semibold text-base">Tickets</h3>
                          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                            {selectedTiers.map((tier) => (
                              <div key={tier.tierName} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                  {tier.qty}x {tier.tierName}
                                </span>
                                <span className="font-semibold">{formatPrice(tier.qty * tier.unitPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-medium"
                          onClick={handleConfirm}
                          disabled={loading}
                        >
                          {loading ? "Processing..." : "Confirm Booking"}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {selectedTiers.map((tier) => (
                      <div key={tier.tierName} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">
                          {tier.qty}x {tier.tierName}
                        </span>
                        <span className="font-medium">{formatPrice(tier.qty * tier.unitPrice)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold">Total</span>
                      <span className="text-xl font-bold text-green-600">{formatPrice(totals.subtotal)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All prices are final. No additional fees.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
