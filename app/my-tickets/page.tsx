"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useMemo } from "react"
import Image from "next/image"
import { ProtectedRoute } from "@/components/protected-route"
import { isEventInPast } from "@/lib/utils-booking"
import { getUserBookings } from "@/lib/supabase/enrollments"
import { useAuth } from "@/contexts/auth-context"
import type { Booking } from "@/lib/types"
import { formatDate, formatTime, formatPrice } from "@/lib/utils-booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, MapPin, Download, TicketIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { downloadInvoice } from "@/lib/utils-invoice"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export default function MyTicketsPage() {
  return (
    <ProtectedRoute>
      <MyTicketsContent />
    </ProtectedRoute>
  )
}

function MyTicketsContent() {
  const { session } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.userId) {
      getUserBookings(session.userId)
        .then((fetchedBookings) => {
          setBookings(fetchedBookings)
          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching bookings:", error)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [session?.userId])

  // Sort bookings by booking date (createdAt) - most recent first
  const sortedBookings = [...bookings].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const upcomingBookings = sortedBookings.filter((b) => b.status === "Confirmed" && !isEventInPast(b.eventDate))
  const pastBookings = sortedBookings.filter((b) => b.status === "Confirmed" && isEventInPast(b.eventDate))

  if (loading) {
    return (
      <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            <BookingsList bookings={upcomingBookings} emptyMessage="No upcoming bookings" />
          </TabsContent>

          <TabsContent value="past">
            <BookingsList bookings={pastBookings} emptyMessage="No past bookings" />
          </TabsContent>
        </Tabs>
      </motion.div>
    </main>
  )
}

function BookingsList({ bookings, emptyMessage }: { bookings: Booking[]; emptyMessage: string }) {
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(bookings.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedBookings = bookings.slice(startIndex, endIndex)

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1)
    }
  }, [totalPages, currentPage])

  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <TicketIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-lg text-muted-foreground mb-4">{emptyMessage}</p>
        <Button asChild className="bg-green-600 hover:bg-green-700">
          <a href="/">Browse Events</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-center">Tickets</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Payment Status</TableHead>
                <TableHead className="text-center w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.map((booking) => (
                <BookingTableRow key={booking.bookingId} booking={booking} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) setCurrentPage(currentPage - 1)
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(page)
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                )
              }
              return null
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) setCurrentPage(currentPage + 1)
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Showing {startIndex + 1} to {Math.min(endIndex, bookings.length)} of {bookings.length} bookings
      </div>
    </div>
  )
}

function BookingTableRow({ booking }: { booking: Booking }) {
  const { session } = useAuth()

  const handleDownloadInvoice = async () => {
    if (session) {
      await downloadInvoice(booking, session.name, session.email)
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 flex-shrink-0 rounded overflow-hidden">
            <Image
              src={booking.coverImage || "/placeholder.svg"}
              alt={booking.eventTitle}
              fill
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{booking.eventTitle}</p>
            <p className="text-xs text-muted-foreground">
              Booking #{booking.bookingId}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(booking.eventDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTime(booking.eventTime)}</span>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-2">{booking.location}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <span className="text-sm">
          {booking.tickets.length} {booking.tickets.length === 1 ? "ticket" : "tickets"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <span className="font-semibold text-green-600">{formatPrice(booking.totals.total)}</span>
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant={
            booking.paymentStatus === 'paid'
              ? 'default'
              : booking.paymentStatus === 'refunded'
                ? 'secondary'
                : 'destructive'
          }
          className={booking.paymentStatus === 'paid' ? 'bg-green-600' : ''}
        >
          {booking.paymentStatus === 'paid'
            ? 'Paid'
            : booking.paymentStatus === 'refunded'
              ? 'Refunded'
              : 'Unpaid'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center">
          <Button variant="ghost" size="sm" onClick={handleDownloadInvoice} title="Download Invoice">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}
