"use client"

import { motion } from "framer-motion"
import { useEffect, useState, Suspense, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { EventCard } from "@/components/event-card"
import { getPublishedEventsApp } from "@/lib/supabase/events"
import type { Event } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useWindowFocus } from "@/hooks/use-window-focus"

function EventsPageContent() {
  const searchParams = useSearchParams()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState<string>("soonest")
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

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category === selectedCategory)
    }

    // Sort
    if (sortBy === "soonest") {
      filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    // Simulate loading for filter changes
    setLoading(true)
    const timer = setTimeout(() => {
      setFilteredEvents(filtered)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [events, searchQuery, selectedCategory, sortBy])

  return (
    <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
      {/* Filters Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Discover Events</h1>

        <div className="space-y-4">
          {/* Search and Sort Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soonest">Soonest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Football">Football</SelectItem>
                <SelectItem value="Party">Party</SelectItem>
                <SelectItem value="Concert">Concert</SelectItem>
              </SelectContent>
            </Select>

            {(searchQuery || selectedCategory !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("all")
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">{loading ? "Loading..." : `${filteredEvents.length} events found`}</p>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-4">No events found</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
            >
              Clear Filters
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event, index) => (
              <EventCard key={(event as any).eventId || event.slug} event={event} index={index} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EventsPageContent />
    </Suspense>
  )
}
