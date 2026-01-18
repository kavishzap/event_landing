import { NextRequest, NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import { createClient } from '@supabase/supabase-js'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ bookingId: string }> } | { params: { bookingId: string } }
) {
  try {
    // Handle params - could be sync or async depending on Next.js version
    let bookingIdParam: string
    try {
      if (props.params && typeof props.params === 'object' && 'then' in props.params) {
        // Async params (Next.js 15+)
        const resolved = await props.params
        bookingIdParam = resolved.bookingId
      } else {
        // Sync params (Next.js 14)
        bookingIdParam = (props.params as { bookingId: string }).bookingId
      }
    } catch (error) {
      console.error('Error accessing params:', error)
      return NextResponse.json(
        { error: 'Failed to parse route parameters' },
        { status: 400 }
      )
    }
    
    if (!bookingIdParam) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }
    
    const bookingId = parseInt(bookingIdParam, 10)
    
    if (isNaN(bookingId) || bookingId <= 0) {
      return NextResponse.json(
        { error: `Invalid booking ID: ${bookingIdParam}` },
        { status: 400 }
      )
    }

    // Get authorization token from request headers
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value
    
    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      }
    )

    // Get user from token or try to get session
    let userId: string | null = null
    let userEmail: string = ''
    
    if (token) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(token)
      if (!userError && user) {
        userId = user.id
        userEmail = user.email || ''
      }
    }
    
    // If no user from token, try to get session from cookies
    if (!userId) {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        return NextResponse.json(
          { error: 'Unauthorized - Please log in to download invoices' },
          { status: 401 }
        )
      }
      userId = session.user.id
      userEmail = session.user.email || ''
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      )
    }

    // If email is still empty, try to get it from auth
    if (!userEmail) {
      const { data: { user } } = await supabase.auth.getUser(userId)
      userEmail = user?.email || ''
    }

    // Get the enrollment directly from the database
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('event_enrollments')
      .select('*')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Get the event for this enrollment
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', enrollment.event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Use event details directly
    const eventDate = new Date(event.event_datetime)
    const subtotal = enrollment.amount_paid || (event.ticket_price ? Number(event.ticket_price) * enrollment.quantity : 0)
    const fees = 0 // No booking fee
    const total = subtotal
    const paymentStatus = enrollment.payment_status || 'unpaid'
    const amountPaid = enrollment.amount_paid || 0
    const amountDue = total - amountPaid

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single()

    // Ensure we have the email
    if (!userEmail) {
      const { data: { user } } = await supabase.auth.getUser(userId)
      userEmail = user?.email || 'N/A'
    }
    
    const userName = profile 
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || userEmail.split('@')[0] || 'User'
      : userEmail.split('@')[0] || 'User'

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

    const invoiceDate = formatDate(enrollment.created_at)

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
    const paidColor = hexToRgb('#065f46')
    const unpaidColor = hexToRgb('#991b1b')

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
    doc.text('Event Ticket Invoice', 20, yPos)

    // Invoice title and info (right aligned)
    doc.setFontSize(20)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('INVOICE', 190, 25, { align: 'right' })
    
    doc.setFontSize(9)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text(`Date: ${invoiceDate}`, 190, 34, { align: 'right' })
    
    // Payment status
    const statusColors: Record<string, [number, number, number]> = {
      paid: paidColor,
      unpaid: unpaidColor,
      refunded: mutedColor
    }
    doc.setTextColor(...(statusColors[paymentStatus] || mutedColor))
    doc.text(`Status: ${paymentStatus.toUpperCase()}`, 190, 42, { align: 'right' })

    yPos += 15
    // Line separator
    drawLine(20, yPos, 190, yPos, greenColor, 2)

    yPos += 15

    // Customer Information
    doc.setFontSize(12)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFont('helvetica', 'bold')
    doc.text('Customer Information', 20, yPos)
    
    yPos += 5
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Name:', 20, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(userName, 35, yPos)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Email:', 110, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(userEmail, 130, yPos, { maxWidth: 60 })

    yPos += 5
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Booking Date:', 20, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(invoiceDate, 50, yPos)

    yPos += 12

    // Event Details
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Event Details', 20, yPos)
    
    yPos += 5
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Event Name:', 20, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(event.name, 45, yPos, { maxWidth: 80 })
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Time:', 110, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(formatTime(eventDate.toTimeString().slice(0, 5)), 125, yPos)

    yPos += 5
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Date:', 20, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(formatDate(eventDate.toISOString().split('T')[0]), 35, yPos)
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Location:', 110, yPos)
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(event.location || 'TBA', 135, yPos, { maxWidth: 55 })
    
    // Add event description if available
    if (event.description) {
      yPos += 5
      doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
      doc.text('Description:', 20, yPos)
      yPos += 4
      doc.setFontSize(8)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      const desc = event.description.substring(0, 200) + (event.description.length > 200 ? '...' : '')
      doc.text(desc, 20, yPos, { maxWidth: 170 })
    }

    yPos += 12

    // Ticket Details Table
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Ticket Details', 20, yPos)
    
    yPos += 5
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 8
    // Table header
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Ticket Type', 20, yPos)
    doc.text('Quantity', 70, yPos, { align: 'center' })
    doc.text('Unit Price', 130, yPos, { align: 'right' })
    doc.text('Total', 190, yPos, { align: 'right' })

    yPos += 6
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)

    yPos += 4

    // Table rows
    const tierName = event.ticket_price ? 'Regular' : 'Free'
    const unitPrice = event.ticket_price ? Number(event.ticket_price) : 0
    const quantity = enrollment.quantity
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text(tierName, 20, yPos)
    doc.text(String(quantity), 70, yPos, { align: 'center' })
    doc.text(formatPrice(unitPrice), 130, yPos, { align: 'right' })
    doc.text(formatPrice(quantity * unitPrice), 190, yPos, { align: 'right' })
    yPos += 6

    yPos += 6

    // Summary
    drawLine(20, yPos, 190, yPos, borderColor, 1)
    yPos += 5

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.text('Subtotal:', 130, yPos, { align: 'right' })
    doc.text(formatPrice(subtotal), 190, yPos, { align: 'right' })

    yPos += 5
    doc.text('Booking Fee:', 130, yPos, { align: 'right' })
    doc.text(formatPrice(fees), 190, yPos, { align: 'right' })

    yPos += 6
    drawLine(130, yPos, 190, yPos, borderColor, 0.5)

    yPos += 5
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
    doc.text('Total Amount:', 130, yPos, { align: 'right' })
    doc.text(formatPrice(total), 190, yPos, { align: 'right' })

    if (paymentStatus === 'unpaid' && amountDue > 0) {
      yPos += 6
      drawLine(130, yPos, 190, yPos, borderColor, 0.5)

      yPos += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(unpaidColor[0], unpaidColor[1], unpaidColor[2])
      doc.text('Amount Paid:', 130, yPos, { align: 'right' })
      doc.text(formatPrice(amountPaid), 190, yPos, { align: 'right' })

      yPos += 5
      doc.setFontSize(12)
      doc.text('Amount Due:', 130, yPos, { align: 'right' })
      doc.text(formatPrice(amountDue), 190, yPos, { align: 'right' })
    } else if (paymentStatus === 'paid') {
      yPos += 6
      drawLine(130, yPos, 190, yPos, borderColor, 0.5)

      yPos += 5
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(paidColor[0], paidColor[1], paidColor[2])
      doc.text('Amount Paid:', 130, yPos, { align: 'right' })
      doc.text(formatPrice(amountPaid), 190, yPos, { align: 'right' })
    }

    yPos += 12

    // Footer
    drawLine(20, yPos, 190, yPos, borderColor, 0.5)
    yPos += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor[0], mutedColor[1], mutedColor[2])
    doc.text('Thank you for your booking with Digital Factory Events!', 105, yPos, { align: 'center' })
    yPos += 5
    doc.text('This is an automated invoice. For any queries, please contact support.', 105, yPos, { align: 'center' })

    // Generate PDF buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Return PDF as response
    const eventTitleSlug = event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${eventTitleSlug}-${invoiceDate.replace(/[^a-z0-9]/gi, '-')}.pdf"`,
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
