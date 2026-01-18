export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date)
}

export const formatTime = (timeString: string): string => {
  const [hours, minutes] = timeString.split(":")
  const date = new Date()
  date.setHours(Number.parseInt(hours), Number.parseInt(minutes))
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export const formatPrice = (price: number): string => {
  return `Rs ${price.toFixed(2)}`
}

export const generateTicketCode = (): string => {
  return `TKT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

export const generateQRCode = (ticketCode: string): string => {
  // In a real app, this would generate an actual QR code
  // For now, we'll use a placeholder QR code service
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketCode)}`
}

export const calculateFees = (subtotal: number): number => {
  return 0 // No booking fee
}

export const isEventInPast = (dateString: string): boolean => {
  const eventDate = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return eventDate < today
}
