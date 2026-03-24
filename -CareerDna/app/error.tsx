'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <h2 className="text-2xl font-bold tracking-tight text-white mb-2">Something went wrong!</h2>
      <p className="text-gray-400 mb-6">We apologize for the inconvenience.</p>
      <Button onClick={() => reset()} className="min-h-[44px]">Try again</Button>
    </div>
  )
}
