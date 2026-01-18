import { supabase } from './client'
import type {
  Event,
  EventEnrollment,
  EventVote,
  PublicEvent,
  EventWithEnrollments,
  EventWithVotes,
  Profile,
  EventStatus,
  PaymentStatus,
} from './types'

// =========================================================
// PROFILES API
// =========================================================

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'phone'>>,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return null
  }

  return data
}

// =========================================================
// EVENTS API
// =========================================================

/**
 * Get all published events (public landing page)
 */
export async function getPublishedEvents(): Promise<PublicEvent[]> {
  const { data, error } = await supabase
    .from('v_public_events')
    .select('*')
    .order('event_datetime', { ascending: true })

  if (error) {
    console.error('Error fetching published events:', error)
    return []
  }

  return data || []
}

/**
 * Get all events (admin only - includes drafts)
 */
export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching all events:', error)
    return []
  }

  return data || []
}

/**
 * Get event by ID
 */
export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error) {
    console.error('Error fetching event:', error)
    return null
  }

  return data
}

/**
 * Get event with enrollments count
 */
export async function getEventWithEnrollments(eventId: string): Promise<EventWithEnrollments | null> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('Error fetching event:', eventError)
    return null
  }

  const { data: enrollments, error: enrollmentsError } = await supabase
    .from('event_enrollments')
    .select('*')
    .eq('event_id', eventId)

  if (enrollmentsError) {
    console.error('Error fetching enrollments:', enrollmentsError)
  }

  return {
    ...event,
    enrollments: enrollments || [],
    enrollments_count: enrollments?.reduce((sum, e) => sum + e.quantity, 0) || 0,
  }
}

/**
 * Get event with votes count (for undefined events)
 */
export async function getEventWithVotes(eventId: string): Promise<EventWithVotes | null> {
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    console.error('Error fetching event:', eventError)
    return null
  }

  const { data: votes, error: votesError } = await supabase
    .from('event_votes')
    .select('*')
    .eq('event_id', eventId)

  if (votesError) {
    console.error('Error fetching votes:', votesError)
  }

  return {
    ...event,
    votes: votes || [],
    votes_count: votes?.length || 0,
  }
}

/**
 * Create a new event (admin only)
 */
export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()

  if (error) {
    console.error('Error creating event:', error)
    return null
  }

  return data
}

/**
 * Update an event (admin only)
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>,
): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating event:', error)
    return null
  }

  return data
}

/**
 * Update event status
 */
export async function updateEventStatus(eventId: string, status: EventStatus): Promise<Event | null> {
  return updateEvent(eventId, { status })
}

// =========================================================
// ENROLLMENTS API
// =========================================================

/**
 * Get user's enrollments
 */
export async function getUserEnrollments(userId: string): Promise<EventEnrollment[]> {
  const { data, error } = await supabase
    .from('event_enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user enrollments:', error)
    return []
  }

  return data || []
}

/**
 * Get enrollments for an event (admin only)
 */
export async function getEventEnrollments(eventId: string): Promise<EventEnrollment[]> {
  const { data, error } = await supabase
    .from('event_enrollments')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event enrollments:', error)
    return []
  }

  return data || []
}

/**
 * Create enrollment (book ticket)
 */
export async function createEnrollment(
  eventId: string,
  userId: string,
  quantity: number,
): Promise<EventEnrollment | null> {
  const { data, error } = await supabase
    .from('event_enrollments')
    .insert({
      event_id: eventId,
      user_id: userId,
      quantity,
      payment_status: 'unpaid',
      amount_paid: 0,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating enrollment:', error)
    return null
  }

  return data
}

/**
 * Update enrollment (e.g., update quantity, cancel)
 */
export async function updateEnrollment(
  enrollmentId: number,
  updates: Partial<Pick<EventEnrollment, 'quantity' | 'payment_status' | 'amount_paid'>>,
): Promise<EventEnrollment | null> {
  const { data, error } = await supabase
    .from('event_enrollments')
    .update(updates)
    .eq('id', enrollmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating enrollment:', error)
    return null
  }

  return data
}

/**
 * Mark enrollment as paid (admin only)
 */
export async function markEnrollmentAsPaid(
  enrollmentId: number,
  amountPaid: number,
): Promise<EventEnrollment | null> {
  return updateEnrollment(enrollmentId, {
    payment_status: 'paid',
    amount_paid: amountPaid,
  })
}

/**
 * Check if user can enroll in event (capacity check)
 */
export async function canEnroll(eventId: string, quantity: number): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_enroll', {
    event_uuid: eventId,
    qty: quantity,
  })

  if (error) {
    console.error('Error checking enrollment capacity:', error)
    return false
  }

  return data === true
}

// =========================================================
// VOTES API
// =========================================================

/**
 * Get user's votes
 */
export async function getUserVotes(userId: string): Promise<EventVote[]> {
  const { data, error } = await supabase
    .from('event_votes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user votes:', error)
    return []
  }

  return data || []
}

/**
 * Get votes for an event
 */
export async function getEventVotes(eventId: string): Promise<EventVote[]> {
  const { data, error } = await supabase
    .from('event_votes')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching event votes:', error)
    return []
  }

  return data || []
}

/**
 * Create vote (for undefined events)
 */
export async function createVote(eventId: string, userId: string): Promise<EventVote | null> {
  const { data, error } = await supabase
    .from('event_votes')
    .insert({
      event_id: eventId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating vote:', error)
    return null
  }

  return data
}

/**
 * Check if user can vote (voting window check)
 */
export async function canVote(eventId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('can_vote', {
    event_uuid: eventId,
  })

  if (error) {
    console.error('Error checking vote eligibility:', error)
    return false
  }

  return data === true
}

/**
 * Check if user has already voted
 */
export async function hasUserVoted(eventId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('event_votes')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" which is fine
    console.error('Error checking vote:', error)
    return false
  }

  return !!data
}


