"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock, MapPin, Tag } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Event } from "@/lib/types"
import { formatDate, formatTime, formatPrice } from "@/lib/utils-booking"

interface EventCardProps {
  event: Event & { eventId?: string }
  index?: number
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const isLowStock = event.ticketTiers.some((tier) => tier.remaining > 0 && tier.remaining < 20)
  const isSoldOut = event.ticketTiers.every((tier) => tier.remaining === 0)
  const eventId = (event as any).eventId || event.slug // Fallback to slug if eventId not available

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link href={`/events/${eventId}`} className="h-full block">
        <Card className="h-full overflow-hidden border-border bg-card transition-all hover:shadow-lg hover:shadow-green-500/10 flex flex-col">
          <div className="relative aspect-video overflow-hidden">
            <Image
              src={event.coverImage || "/placeholder.svg"}
              alt={event.title}
              fill
              className="object-cover transition-transform hover:scale-105"
            />
            {(isLowStock || isSoldOut) && (
              <div className="absolute bottom-3 left-3">
                <Badge
                  variant={isSoldOut ? "destructive" : "secondary"}
                  className={isSoldOut ? "" : "bg-orange-600 text-white"}
                >
                  {isSoldOut ? "Sold Out" : "Limited"}
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-semibold mb-2 line-clamp-1">{event.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 break-words">{event.shortDescription || 'No description available'}</p>
            <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatTime(event.time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
            {/* Only show pricing if price > 0 (undefined events with voting open will have priceFrom = 0) */}
            {event.priceFrom > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                <div className="flex items-center gap-1 text-lg font-bold text-green-600">
                  <Tag className="h-4 w-4" />
                  <span>From {formatPrice(event.priceFrom)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  )
}
