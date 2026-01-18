import type { Session, Booking, Event } from "./types"
import { MOCK_EVENTS } from "./mock-data"

const STORAGE_KEYS = {
  SESSION: "deloitte-session",
  BOOKINGS: "deloitte-bookings",
  EVENTS: "deloitte-events",
  EVENTS_VERSION: "deloitte-events-version",
}

const CURRENT_EVENTS_VERSION = "2"

// Session
export const getSession = (): Session | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem(STORAGE_KEYS.SESSION)
  return stored ? JSON.parse(stored) : null
}

export const setSession = (session: Session) => {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session))
}

export const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.SESSION)
}

// Bookings
export const getBookings = (): Booking[] => {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS)
  return stored ? JSON.parse(stored) : []
}

export const addBooking = (booking: Booking) => {
  const bookings = getBookings()
  bookings.push(booking)
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings))
}

export const updateBookingStatus = (bookingId: number, status: "Confirmed" | "Cancelled") => {
  const bookings = getBookings()
  const updated = bookings.map((b) => (b.bookingId === bookingId ? { ...b, status } : b))
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(updated))
}

// Events
export const getEvents = (): Event[] => {
  if (typeof window === "undefined") return MOCK_EVENTS

  const storedVersion = localStorage.getItem(STORAGE_KEYS.EVENTS_VERSION)

  if (storedVersion !== CURRENT_EVENTS_VERSION) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(MOCK_EVENTS))
    localStorage.setItem(STORAGE_KEYS.EVENTS_VERSION, CURRENT_EVENTS_VERSION)
    return MOCK_EVENTS
  }

  const stored = localStorage.getItem(STORAGE_KEYS.EVENTS)
  if (!stored) {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(MOCK_EVENTS))
    localStorage.setItem(STORAGE_KEYS.EVENTS_VERSION, CURRENT_EVENTS_VERSION)
    return MOCK_EVENTS
  }
  return JSON.parse(stored)
}

export const updateEventTickets = (slug: string, tierName: string, quantity: number) => {
  const events = getEvents()
  const updated = events.map((event) => {
    if (event.slug === slug) {
      return {
        ...event,
        ticketTiers: event.ticketTiers.map((tier) =>
          tier.name === tierName ? { ...tier, remaining: Math.max(0, tier.remaining - quantity) } : tier,
        ),
      }
    }
    return event
  })
  localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(updated))
}

export const getEventBySlug = (slug: string): Event | undefined => {
  return getEvents().find((event) => event.slug === slug)
}

export const isEventInPast = (dateString: string): boolean => {
  const eventDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate < today
}
