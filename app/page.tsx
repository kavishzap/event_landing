"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { EventCard } from "@/components/event-card"
import { getPublishedEventsApp } from "@/lib/supabase/events"
import type { Event } from "@/lib/types"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useWindowFocus } from "@/hooks/use-window-focus"

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<string>("date-asc")
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchEvents = useCallback(() => {
    return getPublishedEventsApp()
      .then((fetchedEvents) => {
        setEvents(fetchedEvents)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching events:", error)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  // Refetch events when tab/window gains focus
  useWindowFocus(fetchEvents)

  // Filter and sort events
  useEffect(() => {
    let filtered = [...events]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort events
    if (sortBy === "date-asc") {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (sortBy === "date-desc") {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }

    setFilteredEvents(filtered)
  }, [events, searchQuery, sortBy])

  // Filter upcoming events for banner (events that haven't passed yet)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date)
      eventDate.setHours(0, 0, 0, 0)
      return eventDate >= today
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Featured events: upcoming events that are featured, or if none, just upcoming events
  const featuredEvents = upcomingEvents
    .filter((e) => e.featured)
    .slice(0, 5)
  
  // If no featured upcoming events, use the first upcoming events (soonest first)
  const bannerEvents = featuredEvents.length > 0 
    ? featuredEvents 
    : upcomingEvents.slice(0, 5)

  const nextFeatured = () => {
    setFeaturedIndex((prev) => (prev + 1) % bannerEvents.length)
  }

  const prevFeatured = () => {
    setFeaturedIndex((prev) => (prev - 1 + bannerEvents.length) % bannerEvents.length)
  }

  // Auto-slide effect
  useEffect(() => {
    if (bannerEvents.length <= 1) return // Don't auto-slide if there's only one or no events
    
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % bannerEvents.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [bannerEvents.length]) // Re-run when banner events change

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero / Featured Events Carousel */}
      <section className="relative bg-card border-b border-border overflow-hidden">
        {bannerEvents.length > 0 ? (
          <motion.div
            key={featuredIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative h-[500px] md:h-[600px]"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${bannerEvents[featuredIndex]?.coverImage})`,
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
            </div>

            <div className="relative container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 h-full flex items-end pb-12">
              <div className="max-w-2xl">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 text-balance">
                    {bannerEvents[featuredIndex]?.title}
                  </h1>
                  <p className="text-lg md:text-xl text-muted-foreground mb-6 line-clamp-3 break-words">
                    {bannerEvents[featuredIndex]?.shortDescription}
                  </p>
                  <Button size="lg" className="bg-green-600 hover:bg-green-700" asChild>
                    <a href={`/events/${(bannerEvents[featuredIndex] as any)?.eventId || bannerEvents[featuredIndex]?.slug}`}>Book Now</a>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Navigation */}
            {bannerEvents.length > 1 && (
              <div className="absolute bottom-6 right-6 flex gap-2">
                <Button variant="secondary" size="icon" onClick={prevFeatured} className="rounded-full">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" onClick={nextFeatured} className="rounded-full">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Digital Factory Events</h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-6">Discover amazing events happening near you</p>
          </div>
        )}
      </section>

      {/* All Events Grid */}
      <section className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-6">Events</h2>
          
          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events, locations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-asc">Date: Earliest First</SelectItem>
                <SelectItem value="date-desc">Date: Latest First</SelectItem>
              </SelectContent>
            </Select>

            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            )}
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">
              {searchQuery ? "No events found matching your search." : "No events at the moment."}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={(event as any).eventId || event.slug} event={event} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
