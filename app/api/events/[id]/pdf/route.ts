import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { getEventById } from '@/lib/supabase/api'
import { dbEventToAppEvent } from '@/lib/supabase/utils'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> } | { params: { id: string } }
) {
  try {
    // Handle params - could be sync or async depending on Next.js version
    let eventIdParam: string
    try {
      if (props.params && typeof props.params === 'object' && 'then' in props.params) {
        // Async params (Next.js 15+)
        const resolved = await props.params
        eventIdParam = resolved.id
      } else {
        // Sync params (Next.js 14)
        eventIdParam = (props.params as { id: string }).id
      }
    } catch (error) {
      console.error('Error accessing params:', error)
      return NextResponse.json(
        { error: 'Failed to parse route parameters' },
        { status: 400 }
      )
    }
    
    if (!eventIdParam) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Fetch event from API using the same function as the frontend
    const dbEvent = await getEventById(eventIdParam)
    
    if (!dbEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Convert to app format (same as frontend does)
    const event = dbEventToAppEvent(dbEvent)
    const eventDate = new Date(dbEvent.event_datetime)

    // Format helpers
    const formatDate = (dateString: string): string => {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    }

    const formatTime = (timeString: string): string => {
      const [hours, minutes] = timeString.split(':')
      const date = new Date()
      date.setHours(parseInt(hours), parseInt(minutes))
      return date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatPrice = (price: number): string => {
      return `Rs ${price.toFixed(2)}`
    }

    // Create PDF using jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Convert colors from hex to RGB for jsPDF
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
          ]
        : [0, 0, 0]
    }

    const greenColor = hexToRgb('#16a34a')
    const textColor = hexToRgb('#333333')
    const mutedColor = hexToRgb('#666666')
    const borderColor = hexToRgb('#e5e7eb')

    // Helper to draw line
    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: [number, number, number], width: number = 0.5) => {
      doc.setDrawColor(color[0], color[1], color[2])
      doc.setLineWidth(width)
      doc.line(x1, y1, x2, y2)
    }

    let yPos = 25 // Start position in mm

    // Header
    doc.setFontSize(24)
    doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
    doc.text('Digital Factory Events', 20, yPos)
    
    yPos += 8
    doc.setFontSize(10)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Event Details', 20, yPos)

    // Event title (right aligned)
    doc.setFontSize(20)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('EVENT DETAILS', 190, 25, { align: 'right' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text(`Generated: ${formatDate(new Date().toISOString())}`, 190, 34, { align: 'right' })

    yPos += 15
    // Line separator
    drawLine(20, yPos, 190, yPos, greenColor, 2)

    yPos += 10

    // Event Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(event.title, 20, yPos, { maxWidth: 170 })
    
    // Calculate height for title (rough estimate)
    const titleLines = doc.splitTextToSize(event.title, 170)
    yPos += titleLines.length * 6 + 5

    // Event Description
    if (event.shortDescription) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text('Description', 20, yPos)
      
      yPos += 5
      drawLine(20, yPos, 190, yPos, borderColor, 0.5)

      yPos += 8
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      const descLines = doc.splitTextToSize(event.shortDescription, 170)
      doc.text(descLines, 20, yPos)
      yPos += descLines.length * 5 + 5
    } else {
      yPos += 5
    }

    // Event Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Event Information', 20, yPos)
    
    yPos += 5
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Date:', 20, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(formatDate(event.date), 35, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Time:', 110, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(formatTime(event.time), 125, yPos)

    yPos += 5
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Location:', 20, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(event.location, 45, yPos, { maxWidth: 80 })
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Category:', 110, yPos)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(event.category, 145, yPos)

    yPos += 12

    // Ticket Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Ticket Information', 20, yPos)
    
    yPos += 5
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 8
    // Table header
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Ticket Type', 20, yPos)
    doc.text('Price', 70, yPos)
    doc.text('Capacity', 130, yPos)
    doc.text('Remaining', 190, yPos, { align: 'right' })

    yPos += 6
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 4

    // Table rows
    event.ticketTiers.forEach((tier) => {
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(tier.name, 20, yPos)
      doc.text(formatPrice(tier.price), 70, yPos)
      doc.text(String(tier.capacity), 130, yPos)
      doc.text(String(tier.remaining), 190, yPos, { align: 'right' })
      yPos += 6
    })

    yPos += 6

    // Price Summary
    if (event.priceFrom > 0) {
      drawLine(20, yPos, 190, yPos, borderColor, 1)

      yPos += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text('Price From:', 130, yPos, { align: 'right' })
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
      doc.text(formatPrice(event.priceFrom), 190, yPos, { align: 'right' })
    }

    yPos += 12

    // Footer
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Thank you for your interest in Digital Factory Events!', 105, yPos, { align: 'center' })
    yPos += 5
    doc.text('For booking and inquiries, please visit our events page.', 105, yPos, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF as response
    const eventTitleSlug = event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Event-${eventTitleSlug}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
