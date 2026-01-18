/**
 * Convenience functions for fetching events in app format
 * These functions bridge the gap between database format and app format
 */

import { getPublishedEvents, getAllEvents, getEventById } from './api'
import { dbEventToAppEvent } from './utils'
import type { Event as AppEvent } from '../types'

/**
 * Get all published events in app format
 */
export async function getPublishedEventsApp(): Promise<AppEvent[]> {
  const dbEvents = await getPublishedEvents()
  return dbEvents.map(dbEventToAppEvent)
}

/**
 * Get all events in app format (admin only)
 */
export async function getAllEventsApp(): Promise<AppEvent[]> {
  const dbEvents = await getAllEvents()
  return dbEvents.map(dbEventToAppEvent)
}

/**
 * Get event by ID in app format
 */
export async function getEventByIdApp(eventId: string): Promise<AppEvent | null> {
  const dbEvent = await getEventById(eventId)
  if (!dbEvent) return null
  return dbEventToAppEvent(dbEvent)
}

/**
 * Get event by slug (searches by name and converts to slug)
 * Note: This is a simple implementation. For better performance, 
 * consider adding a slug column to your events table.
 */
export async function getEventBySlugApp(slug: string): Promise<AppEvent | null> {
  const dbEvents = await getPublishedEvents()
  
  // Find event where slug matches
  const dbEvent = dbEvents.find((e) => {
    const eventSlug = e.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return eventSlug === slug
  })
  
  if (!dbEvent) return null
  return dbEventToAppEvent(dbEvent)
}

/**
 * Get event ID by slug (for creating enrollments/votes)
 */
export async function getEventIdBySlug(slug: string): Promise<string | null> {
  const dbEvents = await getPublishedEvents()
  
  const dbEvent = dbEvents.find((e) => {
    const eventSlug = e.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    return eventSlug === slug
  })
  
  return dbEvent?.id || null
}

