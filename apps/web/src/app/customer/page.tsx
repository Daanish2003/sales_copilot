"use client"
import { LanguageProvider, useLanguage } from "@/hooks/use-language"
import CustomerCallInterface from "@/components/customer-call-interface"
import { CallProvider, useCallContext } from "@/hooks/use-call-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function CustomerContent() {
  const { t } = useLanguage()
  const { callDuration, isConnected, callId } = useCallContext()
  const router = useRouter()
  const [isReady, setIsReady] = useState(true)

  useEffect(() => {
    setIsReady(true)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (!isReady) {
    return null
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="w-full max-w-sm sm:max-w-md">
        <CustomerCallInterface
          isCallActive={isConnected}
          callDuration={formatTime(callDuration)}
          onEndCall={() => router.push("/")}
        />
      </div>
    </main>
  )
}

export default function CustomerPage() {
  return (
    <CallProvider role="customer">
      <LanguageProvider>
        <CustomerContent />
      </LanguageProvider>
    </CallProvider>
  )
}
