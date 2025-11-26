import { LanguageProvider, useLanguage } from "@/hooks/use-language"
import CustomerCallInterface from "@/components/customer-call-interface"
import { CallProvider, useCallContext } from "@/hooks/use-call-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

function CustomerContent() {
  const { t } = useLanguage()
  const { callDuration, isConnected, callId } = useCallContext()
  const router = useRouter()
  const [showNoCallIdWarning, setShowNoCallIdWarning] = useState(false)

  useEffect(() => {
    if (!callId) {
      setShowNoCallIdWarning(true)
      const timer = setTimeout(() => router.push("/"), 3000)
      return () => clearTimeout(timer)
    }
  }, [callId, router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  if (showNoCallIdWarning) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Call ID Found</h2>
          <p className="text-slate-400 mb-4">Redirecting to home page...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
