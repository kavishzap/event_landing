import type { Booking } from './types'
import { formatDate, formatTime, formatPrice } from './utils-booking'
import { supabase } from './supabase/client'

export function generateInvoiceHTML(booking: Booking, userName: string, userEmail: string): string {
  const invoiceDate = new Date(booking.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const paymentStatus = booking.paymentStatus || 'unpaid'
  const amountPaid = booking.amountPaid || 0
  const totalAmount = booking.totals.total
  const amountDue = totalAmount - amountPaid

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${booking.eventTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4;
      margin: 15mm;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.4;
      color: #333;
      background: #fff;
      padding: 15mm;
      font-size: 11px;
    }
    .invoice-container {
      max-width: 100%;
      margin: 0 auto;
      background: #fff;
      page-break-inside: avoid;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #16a34a;
      page-break-inside: avoid;
    }
    .logo-section h1 {
      font-size: 20px;
      color: #16a34a;
      margin-bottom: 3px;
      line-height: 1.2;
    }
    .logo-section p {
      color: #666;
      font-size: 10px;
    }
    .invoice-info {
      text-align: right;
    }
    .invoice-info h2 {
      font-size: 18px;
      color: #333;
      margin-bottom: 5px;
      line-height: 1.2;
    }
    .invoice-info p {
      color: #666;
      font-size: 10px;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .section {
      margin-bottom: 12px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 0;
    }
    .info-item {
      margin-bottom: 6px;
    }
    .info-label {
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      margin-bottom: 2px;
    }
    .info-value {
      font-size: 11px;
      color: #333;
      font-weight: 500;
      line-height: 1.3;
    }
    .tickets-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      font-size: 10px;
    }
    .tickets-table thead {
      background: #f3f4f6;
    }
    .tickets-table th {
      padding: 6px 8px;
      text-align: left;
      font-size: 9px;
      text-transform: uppercase;
      color: #666;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
    }
    .tickets-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 10px;
    }
    .tickets-table tbody tr:last-child td {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .summary {
      margin-top: 12px;
      padding-top: 10px;
      border-top: 2px solid #e5e7eb;
      page-break-inside: avoid;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 11px;
    }
    .summary-row.total {
      margin-top: 6px;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      font-weight: 700;
      color: #16a34a;
    }
    .payment-status {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .payment-status.paid {
      background: #d1fae5;
      color: #065f46;
    }
    .payment-status.unpaid {
      background: #fee2e2;
      color: #991b1b;
    }
    .payment-status.refunded {
      background: #f3f4f6;
      color: #374151;
    }
    .footer {
      margin-top: 15px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #666;
      font-size: 9px;
      page-break-inside: avoid;
    }
    @media print {
      body {
        padding: 15mm;
        font-size: 11px;
      }
      .no-print {
        display: none;
      }
      .invoice-container {
        page-break-inside: avoid;
      }
      .section {
        page-break-inside: avoid;
      }
      .summary {
        page-break-inside: avoid;
      }
      .footer {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo-section">
        <h1>Digital Factory Events</h1>
        <p>Event Ticket Invoice</p>
      </div>
      <div class="invoice-info">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${booking.bookingId}</p>
        <p><strong>Date:</strong> ${invoiceDate}</p>
        <p><strong>Status:</strong> <span class="payment-status ${paymentStatus}">${paymentStatus}</span></p>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Customer Information</div>
      <div class="info-grid">
        <div>
          <div class="info-item">
            <div class="info-label">Name</div>
            <div class="info-value">${userName}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${userEmail}</div>
          </div>
        </div>
        <div>
          <div class="info-item">
            <div class="info-label">Booking ID</div>
            <div class="info-value">${booking.bookingId}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Booking Date</div>
            <div class="info-value">${invoiceDate}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Event Details</div>
      <div class="info-grid">
        <div>
          <div class="info-item">
            <div class="info-label">Event Name</div>
            <div class="info-value">${booking.eventTitle}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date</div>
            <div class="info-value">${formatDate(booking.eventDate)}</div>
          </div>
        </div>
        <div>
          <div class="info-item">
            <div class="info-label">Time</div>
            <div class="info-value">${formatTime(booking.eventTime)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Location</div>
            <div class="info-value">${booking.location}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Ticket Details</div>
      <table class="tickets-table">
        <thead>
          <tr>
            <th>Ticket Type</th>
            <th class="text-center">Quantity</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${booking.selectedTiers.map(tier => `
            <tr>
              <td>${tier.tierName}</td>
              <td class="text-center">${tier.qty}</td>
              <td class="text-right">${formatPrice(tier.unitPrice)}</td>
              <td class="text-right">${formatPrice(tier.qty * tier.unitPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal:</span>
        <span>${formatPrice(booking.totals.subtotal)}</span>
      </div>
      <div class="summary-row">
        <span>Booking Fee:</span>
        <span>${formatPrice(booking.totals.fees)}</span>
      </div>
      <div class="summary-row total">
        <span>Total Amount:</span>
        <span>${formatPrice(totalAmount)}</span>
      </div>
      ${paymentStatus === 'unpaid' ? `
        <div class="summary-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
          <span style="color: #991b1b; font-weight: 600; font-size: 10px;">Amount Paid:</span>
          <span style="color: #991b1b; font-weight: 600; font-size: 10px;">${formatPrice(amountPaid)}</span>
        </div>
        <div class="summary-row" style="color: #991b1b; font-size: 12px; font-weight: 600; margin-top: 4px;">
          <span>Amount Due:</span>
          <span>${formatPrice(amountDue)}</span>
        </div>
      ` : paymentStatus === 'paid' ? `
        <div class="summary-row" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
          <span style="color: #065f46; font-weight: 600; font-size: 10px;">Amount Paid:</span>
          <span style="color: #065f46; font-weight: 600; font-size: 10px;">${formatPrice(amountPaid)}</span>
        </div>
      ` : ''}
    </div>

    <div class="footer">
      <p>Thank you for your booking with Digital Factory Events!</p>
      <p style="margin-top: 4px;">This is an automated invoice. For any queries, please contact support.</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function downloadInvoice(booking: Booking, userName: string, userEmail: string) {
  try {
    // Validate bookingId
    if (!booking.bookingId || typeof booking.bookingId !== 'number') {
      throw new Error(`Invalid booking ID: ${booking.bookingId}`)
    }

    // Get the current session token from Supabase
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      throw new Error('Not authenticated. Please log in to download invoices.')
    }

    // Call the API endpoint to generate PDF server-side
    const apiUrl = `/api/invoice/${booking.bookingId}`
    console.log('Downloading invoice from:', apiUrl)
    
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    // Get the PDF blob
    const blob = await response.blob()
    
    // Create a download link and trigger download
    // Filename will be set by the server via Content-Disposition header
    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    // Get filename from Content-Disposition header if available, otherwise use default
    const contentDisposition = response.headers.get('Content-Disposition')
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        link.download = filenameMatch[1]
      } else {
        link.download = `Invoice-${booking.eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      }
    } else {
      link.download = `Invoice-${booking.eventTitle.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
    }
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (error) {
    console.error('Error downloading PDF:', error)
    // Show error to user
    alert(error instanceof Error ? error.message : 'Failed to download PDF. Please try again or contact support.')
    throw error
  }
}

