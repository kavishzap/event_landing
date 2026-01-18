export type EventCategory = "Football" | "Party" | "Concert"

export type TicketStatus = "Confirmed" | "Cancelled"

export interface TicketTier {
  name: string
  price: number
  capacity: number
  remaining: number
}

export interface Event {
  title: string
  slug: string
  category: EventCategory
  date: string
  time: string
  location: string
  coverImage: string
  priceFrom: number
  ticketTiers: TicketTier[]
  shortDescription: string
  ageRestriction?: string
  featured?: boolean
  votingStatus?: 'open' | 'closed' | null
}

export interface SelectedTier {
  tierName: string
  qty: number
  unitPrice: number
}

export interface Ticket {
  ticketCode: string
  qrCode: string
  tierName: string
}

export interface Booking {
  bookingId: number
  createdAt: string
  eventSlug: string
  eventTitle: string
  eventDate: string
  eventTime: string
  location: string
  coverImage: string
  selectedTiers: SelectedTier[]
  totals: {
    subtotal: number
    fees: number
    total: number
  }
  status: TicketStatus
  tickets: Ticket[]
  paymentStatus?: 'paid' | 'unpaid' | 'refunded'
  amountPaid?: number
}

export interface User {
  id: string
  name: string
  email: string
  password: string
}

export interface Session {
  userId: string
  name: string
  email: string
}
