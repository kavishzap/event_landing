import type { Event as DbEvent, PublicEvent } from './types'
import type { Event as AppEvent } from '../types'

/**
 * Convert database event to app event format
 */
export function dbEventToAppEvent(dbEvent: DbEvent | PublicEvent): AppEvent & { eventId?: string } {
  const eventDate = new Date(dbEvent.event_datetime)
  
  // Extract category from name or description (you may want to add a category field to DB)
  const category = extractCategory(dbEvent.name, dbEvent.description || '')
  
  // Generate slug from name
  const slug = dbEvent.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  
  // Calculate remaining capacity
  const enrolledCount = 'enrolled_count' in dbEvent ? dbEvent.enrolled_count : 0
  const remaining = Math.max(0, dbEvent.capacity - enrolledCount)
  
  // Create ticket tiers
  // For defined events, always use ticket_price
  // For undefined events, only show pricing when voting_status is 'closed'
  const isUndefinedEvent = dbEvent.type === 'undefined'
  const votingClosed = dbEvent.voting_status === 'closed'
  
  // Show pricing only if: defined event OR (undefined event AND voting is closed)
  const shouldShowPricing = !isUndefinedEvent || (isUndefinedEvent && votingClosed)
  const ticketPrice = shouldShowPricing ? (dbEvent.ticket_price || 0) : 0
  
  const ticketTiers = ticketPrice > 0 
    ? [{ name: 'Regular', price: Number(ticketPrice), capacity: dbEvent.capacity, remaining }]
    : [{ name: 'Free', price: 0, capacity: dbEvent.capacity, remaining }]
  
  return {
    title: dbEvent.name,
    slug,
    category: category as AppEvent['category'],
    date: eventDate.toISOString().split('T')[0],
    time: eventDate.toTimeString().slice(0, 5), // HH:MM format
    location: dbEvent.location || 'TBA',
    coverImage: dbEvent.poster_url || '/placeholder.jpg',
    priceFrom: ticketPrice > 0 ? Number(ticketPrice) : 0,
    ticketTiers,
    shortDescription: dbEvent.description || '',
    featured: dbEvent.status === 'published', // You may want to add a featured field
    eventId: dbEvent.id, // Include event ID for API calls
    votingStatus: dbEvent.voting_status, // Include voting status
  }
}

/**
 * Extract category from event name or description
 */
function extractCategory(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase()
  
  if (text.includes('football') || text.includes('soccer') || text.includes('match')) {
    return 'Football'
  }
  if (text.includes('party') || text.includes('celebration') || text.includes('nightlife')) {
    return 'Party'
  }
  if (text.includes('concert') || text.includes('music') || text.includes('festival')) {
    return 'Concert'
  }
  
  // Default category
  return 'Concert'
}

/**
 * Convert app event to database event format (for creating/updating)
 */
export function appEventToDbEvent(
  appEvent: Partial<AppEvent>,
  userId: string,
): Partial<Omit<DbEvent, 'id' | 'created_at' | 'updated_at'>> {
  const eventDateTime = appEvent.date && appEvent.time
    ? new Date(`${appEvent.date}T${appEvent.time}`)
    : new Date()
  
  return {
    created_by: userId,
    type: 'defined', // Default to defined, can be changed
    status: 'draft', // Default to draft
    name: appEvent.title || '',
    description: appEvent.shortDescription || null,
    location: appEvent.location || null,
    capacity: appEvent.ticketTiers?.[0]?.capacity || 0,
    event_datetime: eventDateTime.toISOString(),
    poster_url: appEvent.coverImage || null,
    ticket_price: appEvent.priceFrom || null,
    voting_start: null,
    voting_end: null,
  }
}

