# Supabase Integration

This directory contains all Supabase-related code for the ticket booking application.

## Files

- **`client.ts`** - Supabase client configuration
- **`types.ts`** - TypeScript types matching your database schema
- **`api.ts`** - API functions for database operations
- **`utils.ts`** - Utility functions for converting between database and app formats
- **`events.ts`** - Convenience functions for fetching events in app format

## Quick Start

### 1. Set Environment Variables

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Use in Components

```tsx
import { getPublishedEventsApp } from '@/lib/supabase/events'
import { createEnrollment } from '@/lib/supabase/api'
import { useAuth } from '@/contexts/auth-context'

// Fetch events
const events = await getPublishedEventsApp()

// Create booking
const enrollment = await createEnrollment(eventId, userId, quantity)

// Access auth
const { session, isAuthenticated, login, logout } = useAuth()
```

## Example: Updating Events Page

Replace mock data with Supabase:

```tsx
// Before
import { getEvents } from "@/lib/storage"
const events = getEvents()

// After
import { getPublishedEventsApp } from "@/lib/supabase/events"
const [events, setEvents] = useState<Event[]>([])

useEffect(() => {
  getPublishedEventsApp().then(setEvents)
}, [])
```

## Example: Creating Booking

```tsx
import { createEnrollment, canEnroll } from '@/lib/supabase/api'
import { useAuth } from '@/contexts/auth-context'

const { session } = useAuth()

const handleBook = async () => {
  if (!session) return
  
  // Check capacity
  const canBook = await canEnroll(eventId, quantity)
  if (!canBook) {
    toast({ title: "Not enough tickets available" })
    return
  }
  
  // Create enrollment
  const enrollment = await createEnrollment(eventId, session.userId, quantity)
  if (enrollment) {
    toast({ title: "Booking successful!" })
  }
}
```

## Authentication

The auth context is already integrated with Supabase:

```tsx
const { 
  session,        // Current session
  profile,        // User profile
  login,          // (email, password) => Promise<{success, error}>
  register,       // (name, email, password) => Promise<{success, error}>
  logout,         // () => Promise<void>
  isAuthenticated,// boolean
  loading         // boolean
} = useAuth()
```

## API Reference

See `api.ts` for full API documentation. Main functions:

- **Events**: `getPublishedEvents()`, `getAllEvents()`, `getEventById()`, `createEvent()`, `updateEvent()`
- **Enrollments**: `getUserEnrollments()`, `createEnrollment()`, `updateEnrollment()`, `canEnroll()`
- **Votes**: `getEventVotes()`, `createVote()`, `canVote()`, `hasUserVoted()`
- **Profiles**: `getProfile()`, `updateProfile()`


