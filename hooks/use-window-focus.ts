import { useEffect, useCallback, useRef } from 'react'

/**
 * Custom hook to refetch data when the browser tab/window gains focus.
 * This fixes the issue where Next.js + Supabase don't automatically refetch
 * data when switching back to a tab.
 * 
 * @param refetch - Callback function to refetch data
 * @param options - Options for the hook
 */
export function useWindowFocus(
  refetch: () => void | Promise<void>,
  options: {
    /** Whether the hook is enabled. Default: true */
    enabled?: boolean
    /** Debounce delay in ms before refetching. Default: 100 */
    debounceMs?: number
  } = {}
) {
  const { enabled = true, debounceMs = 100 } = options
  const refetchRef = useRef(refetch)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Update refetch ref when it changes
  useEffect(() => {
    refetchRef.current = refetch
  }, [refetch])

  const handleFocus = useCallback(() => {
    if (!enabled) return

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Debounce the refetch to avoid multiple rapid calls
    timeoutRef.current = setTimeout(() => {
      const result = refetchRef.current()
      // Handle async refetch if needed
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error('Error refetching on window focus:', error)
        })
      }
    }, debounceMs)
  }, [enabled, debounceMs])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('focus', handleFocus)
    
    // Also refetch on visibility change (tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleFocus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [enabled, handleFocus])
}

