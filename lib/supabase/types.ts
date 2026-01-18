// Database types matching your Supabase schema

export type UserRole = 'superadmin' | 'admin' | 'user'
export type EventType = 'defined' | 'undefined'
export type EventStatus = 'draft' | 'published' | 'closed'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded'

export interface Profile {
  id: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  phone: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  created_by: string | null
  type: EventType
  status: EventStatus
  name: string
  description: string | null
  location: string | null
  capacity: number
  event_datetime: string
  poster_url: string | null
  ticket_price: number | null
  voting_start: string | null
  voting_end: string | null
  voting_status?: 'open' | 'closed' | null
  created_at: string
  updated_at: string
}

export interface EventEnrollment {
  id: number
  event_id: string
  user_id: string
  quantity: number
  payment_status: PaymentStatus
  amount_paid: number
  created_at: string
  updated_at: string
}

export interface EventVote {
  id: string
  event_id: string
  user_id: string
  created_at: string
}

// View types
export interface PublicEvent extends Event {
  enrolled_count: number
}

// Helper types for API responses
export interface EventWithEnrollments extends Event {
  enrollments: EventEnrollment[]
  enrollments_count: number
}

export interface EventWithVotes extends Event {
  votes: EventVote[]
  votes_count: number
  voting_status?: 'open' | 'closed' | null
}


