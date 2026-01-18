import type { Event } from './types'

/**
 * Download event details as PDF
 * @param event The event object loaded from the API
 */
export async function downloadEventPDF(event: Event & { eventId?: string }) {
  try {
    // Validate event
    if (!event || !event.eventId) {
      throw new Error('Invalid event data: eventId is required')
    }

    // Call the API endpoint to generate PDF server-side
    const apiUrl = `/api/events/${event.eventId}/pdf`
    console.log('Downloading event PDF from:', apiUrl)
    
    const response = await fetch(apiUrl)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate PDF' }))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    // Get the PDF blob
    const blob = await response.blob()
    
    // Create a download link and trigger download
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
        link.download = `Event-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
      }
    } else {
      link.download = `Event-${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`
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

