"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getEventByIdApp } from "@/lib/supabase/events"
import { useAuth } from "@/contexts/auth-context"
import type { Event, SelectedTier } from "@/lib/types"
import { Calendar, Clock, MapPin, Minus, Plus, Tag, AlertCircle, Heart, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { formatDate, formatTime, formatPrice, calculateFees } from "@/lib/utils-booking"
import { useToast } from "@/hooks/use-toast"
import { canVote, hasUserVoted, createVote, getEventWithVotes } from "@/lib/supabase/api"
import { useWindowFocus } from "@/hooks/use-window-focus"

export default function EventDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAuthenticated, session } = useAuth()
  const { toast } = useToast()
  const [event, setEvent] = useState<(Event & { eventId?: string; eventType?: 'defined' | 'undefined'; votingStatus?: 'open' | 'closed' | null }) | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [votesCount, setVotesCount] = useState(0)
  const [canUserVote, setCanUserVote] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)

  const fetchEvent = useCallback(() => {
    if (!params.id) return Promise.resolve()

    setLoading(true)
    return getEventByIdApp(params.id as string)
      .then((found) => {
        if (found) {
          setEvent(found as Event & { eventId?: string; eventType?: 'defined' | 'undefined' })
          // Initialize quantities
          const initial: Record<string, number> = {}
          found.ticketTiers.forEach((tier) => {
            initial[tier.name] = 0
          })
          setQuantities(initial)
          
          // Check if undefined event and load voting info
          if (found.eventId) {
            getEventWithVotes(found.eventId).then((eventWithVotes) => {
              if (eventWithVotes) {
                setEvent((prev) => ({
                  ...prev!,
                  eventType: eventWithVotes.type,
                  votingStatus: eventWithVotes.voting_status,
                }))
                setVotesCount(eventWithVotes.votes_count)
                
                if (eventWithVotes.type === 'undefined') {
                  // Check if voting is open - allow voting when voting_status is 'open'
                  const isVotingOpen = eventWithVotes.voting_status === 'open'
                  
                  if (session?.userId) {
                    hasUserVoted(found.eventId, session.userId).then(setHasVoted)
                    if (isVotingOpen) {
                      // If voting is open, allow voting (unless already voted)
                      setCanUserVote(true)
                    } else {
                      // Otherwise use the canVote function to check voting window
                      canVote(found.eventId).then(setCanUserVote)
                    }
                  } else {
                    // If not logged in, set canUserVote based on voting status
                    setCanUserVote(isVotingOpen)
                  }
                }
              }
            })
          }
        }
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching event:", error)
        setLoading(false)
      })
  }, [params.id, session?.userId])

  useEffect(() => {
    fetchEvent()
  }, [fetchEvent])

  // Refetch event when tab/window gains focus
  useWindowFocus(fetchEvent)

  const handleVote = async () => {
    if (!event?.eventId || !session?.userId) return
    
    const result = await createVote(event.eventId, session.userId)
    if (result) {
      setHasVoted(true)
      setVotesCount((prev) => prev + 1)
      toast({
        title: "Vote recorded!",
        description: "Your vote has been recorded successfully.",
      })
    } else {
      toast({
        title: "Vote failed",
        description: "Unable to record your vote. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Event Not Found</h1>
          <p className="text-muted-foreground mb-6">The event you're looking for doesn't exist.</p>
          <Button asChild>
            <a href="/events">Browse Events</a>
          </Button>
        </div>
      </div>
    )
  }

  const isSoldOut = event.ticketTiers.every((tier) => tier.remaining === 0)
  const selectedTiers: SelectedTier[] = event.ticketTiers
    .filter((tier) => quantities[tier.name] > 0)
    .map((tier) => ({
      tierName: tier.name,
      qty: quantities[tier.name],
      unitPrice: tier.price,
    }))

  const subtotal = selectedTiers.reduce((sum, tier) => sum + tier.qty * tier.unitPrice, 0)
  const fees = calculateFees(subtotal)
  const total = subtotal + fees

  const hasSelection = selectedTiers.length > 0

  const updateQuantity = (tierName: string, change: number) => {
    setQuantities((prev) => {
      const tier = event.ticketTiers.find((t) => t.name === tierName)
      if (!tier) return prev

      const newQty = Math.max(0, Math.min((prev[tierName] || 0) + change, tier.remaining))
      return { ...prev, [tierName]: newQty }
    })
  }

  const handleBookTickets = () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/events/${event.eventId}`)
      return
    }

    // Store selection in sessionStorage for checkout
    sessionStorage.setItem(
      "checkout-data",
      JSON.stringify({
        event,
        eventId: event.eventId,
        selectedTiers,
        totals: { subtotal, fees, total },
      }),
    )
    router.push("/checkout")
  }

  return (
    <div className="min-h-screen">
      <main>
        {/* Hero Image with Parallax */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative h-[300px] md:h-[500px] overflow-hidden"
        >
          <div className="absolute inset-0">
            <Image src={event.coverImage || "/placeholder.svg"} alt={event.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </div>
        </motion.div>

        <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 -mt-20 relative z-10">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="mb-6">
                  <CardContent className="pt-6">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4 text-balance">{event.title}</h1>

                    <div className="mb-6">
                      <p
                        className={`text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap break-words ${
                          !showFullDescription && event.shortDescription && event.shortDescription.length > 300
                            ? 'line-clamp-4'
                            : ''
                        }`}
                      >
                        {event.shortDescription}
                      </p>
                      {event.shortDescription && event.shortDescription.length > 300 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFullDescription(!showFullDescription)}
                          className="mt-2 text-green-600 hover:text-green-700 p-0 h-auto"
                        >
                          {showFullDescription ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Read more
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4 py-6 border-y border-border">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-semibold">{formatDate(event.date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="font-semibold">{formatTime(event.time)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:col-span-2">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-semibold">{event.location}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Voting Section for Undefined Events */}
                {event.eventType === 'undefined' && (
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle>Vote for this Event</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {votesCount} {votesCount === 1 ? 'person has' : 'people have'} voted
                          </p>
                          <p className="text-sm">
                            {canUserVote && !hasVoted
                              ? "Show your interest by voting!"
                              : hasVoted
                                ? "You've already voted for this event"
                                : "Voting window is closed"}
                          </p>
                        </div>
                        {canUserVote && !hasVoted && isAuthenticated && (
                          <Button
                            onClick={handleVote}
                            className="bg-blue-600 hover:bg-blue-700"
                            size="lg"
                          >
                            <Heart className="h-4 w-4 mr-2" />
                            Vote
                          </Button>
                        )}
                        {!isAuthenticated && canUserVote && (
                          <Button
                            onClick={() => router.push(`/login?returnUrl=/events/${event.eventId}`)}
                            variant="outline"
                            size="lg"
                          >
                            Login to Vote
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Ticket Selection - Only for Defined Events OR Undefined Events with Voting Closed */}
                {((event.eventType === 'defined' || event.eventType === undefined) || (event.eventType === 'undefined' && event.votingStatus === 'closed')) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Select Tickets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {event.ticketTiers.map((tier) => {
                        const isLowStock = tier.remaining > 0 && tier.remaining < 20
                        const isTierSoldOut = tier.remaining === 0

                        return (
                          <div key={tier.name} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{tier.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {isTierSoldOut ? (
                                    <span className="text-destructive">Sold out</span>
                                  ) : (
                                    <>
                                      {tier.remaining} remaining
                                      {isLowStock && <span className="text-orange-600 ml-2">Limited!</span>}
                                    </>
                                  )}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-green-600">{formatPrice(tier.price)}</p>
                              </div>
                            </div>

                            {!isTierSoldOut && (
                              <div className="flex items-center gap-3 mt-4">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(tier.name, -1)}
                                  disabled={quantities[tier.name] === 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="text-xl font-semibold w-12 text-center">{quantities[tier.name]}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(tier.name, 1)}
                                  disabled={quantities[tier.name] >= tier.remaining}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        )
                      })}

                      {!isSoldOut && (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            {isAuthenticated
                              ? "Select your tickets above to continue to checkout."
                              : "Please login to book tickets for this event."}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </div>

            {/* Sticky Summary Sidebar - Desktop */}
            {((event.eventType === 'defined' || event.eventType === undefined) || (event.eventType === 'undefined' && event.votingStatus === 'closed')) && (
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:sticky lg:top-24"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Order Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {hasSelection ? (
                        <>
                          <div className="space-y-2">
                            {selectedTiers.map((tier) => (
                              <div key={tier.tierName} className="flex justify-between text-sm">
                                <span>
                                  {tier.qty}x {tier.tierName}
                                </span>
                                <span>{formatPrice(tier.qty * tier.unitPrice)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-border space-y-2">
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total</span>
                              <span className="text-green-600">{formatPrice(subtotal)}</span>
                            </div>
                          </div>

                          <Button
                            className="w-full bg-green-600 hover:bg-green-700"
                            size="lg"
                            onClick={handleBookTickets}
                          >
                            {isAuthenticated ? "Book Tickets" : "Login to Book"}
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          {isSoldOut ? (
                            <p>All tickets are sold out</p>
                          ) : (
                            <>
                              <Tag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p>Select tickets to see pricing</p>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Voting Summary Sidebar for Undefined Events */}
            {event.eventType === 'undefined' && (
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:sticky lg:top-24"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Event Interest</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-4">
                        <Heart className="h-12 w-12 mx-auto mb-3 text-blue-600" />
                        <p className="text-2xl font-bold">{votesCount}</p>
                        <p className="text-sm text-muted-foreground">
                          {votesCount === 1 ? 'person has' : 'people have'} shown interest
                        </p>
                      </div>
                      {canUserVote && !hasVoted && isAuthenticated && (
                        <Button
                          onClick={handleVote}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="lg"
                        >
                          <Heart className="h-4 w-4 mr-2" />
                          Vote for this Event
                        </Button>
                      )}
                      {!isAuthenticated && canUserVote && (
                        <Button
                          onClick={() => router.push(`/login?returnUrl=/events/${event.eventId}`)}
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          Login to Vote
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sticky Bottom Bar */}
        {hasSelection && !isSoldOut && ((event.eventType === 'defined' || event.eventType === undefined) || (event.eventType === 'undefined' && event.votingStatus === 'closed')) && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-6 sm:px-8 py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-green-600">{formatPrice(total)}</span>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700" size="lg" onClick={handleBookTickets}>
              {isAuthenticated ? "Book Tickets" : "Login to Book"}
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

