/**
 * Helper functions for working with enrollments in app format
 */

import { getUserEnrollments, getEventById } from './api'
import { dbEventToAppEvent } from './utils'
import type { EventEnrollment } from './types'
import type { Booking, Ticket } from '../types'
import { generateTicketCode, generateQRCode } from '../utils-booking'

/**
 * Convert enrollment to booking format for display
 */
export async function enrollmentToBooking(enrollment: EventEnrollment): Promise<Booking | null> {
  const event = await getEventById(enrollment.event_id)
  if (!event) return null

  const appEvent = dbEventToAppEvent(event)
  const eventDate = new Date(event.event_datetime)

  // Generate tickets based on quantity
  const tickets: Ticket[] = Array.from({ length: enrollment.quantity }, (_, i) => {
    const ticketCode = generateTicketCode()
    return {
      ticketCode,
      qrCode: generateQRCode(ticketCode),
      tierName: event.ticket_price ? 'Regular' : 'Free',
    }
  })

  // Calculate totals (no booking fee)
  const subtotal = enrollment.amount_paid || (event.ticket_price ? Number(event.ticket_price) * enrollment.quantity : 0)
  const fees = 0 // No booking fee
  const total = subtotal // Total equals subtotal

  return {
    bookingId: enrollment.id,
    createdAt: enrollment.created_at,
    eventSlug: appEvent.slug,
    eventTitle: appEvent.title,
    eventDate: eventDate.toISOString().split('T')[0],
    eventTime: eventDate.toTimeString().slice(0, 5),
    location: event.location || 'TBA',
    coverImage: event.poster_url || '/placeholder.jpg',
    selectedTiers: [
      {
        tierName: event.ticket_price ? 'Regular' : 'Free',
        qty: enrollment.quantity,
        unitPrice: event.ticket_price ? Number(event.ticket_price) : 0,
      },
    ],
    totals: {
      subtotal,
      fees,
      total,
    },
    status: enrollment.payment_status === 'paid' ? 'Confirmed' : enrollment.payment_status === 'refunded' ? 'Cancelled' : 'Confirmed',
    tickets,
    paymentStatus: enrollment.payment_status,
    amountPaid: enrollment.amount_paid,
  }
}

/**
 * Get user's bookings in app format
 */
export async function getUserBookings(userId: string): Promise<Booking[]> {
  const enrollments = await getUserEnrollments(userId)
  const bookings: Booking[] = []

  for (const enrollment of enrollments) {
    const booking = await enrollmentToBooking(enrollment)
    if (booking) {
      bookings.push(booking)
    }
  }

  return bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}


