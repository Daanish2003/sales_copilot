"use client"

import { Mic2, Phone, Settings, Home, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"
import LanguageSwitcher from "./language-switcher"
import Link from "next/link"

interface CallHeaderProps {
  callId?: string
}

export default function CallHeader({ callId }: CallHeaderProps) {
  const [callDuration, setCallDuration] = useState("00:00")
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const mins = now.getMinutes()
      const secs = now.getSeconds()
      setCallDuration(`${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCopyCallId = () => {
    if (callId) {
      navigator.clipboard.writeText(callId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Mic2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("header.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("header.subtitle")}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-foreground">{callDuration}</p>
            <p className="text-xs text-muted-foreground">{t("callDuration")}</p>
          </div>

          {callId && (
            <div className="px-3 py-2 bg-secondary rounded-lg border border-border flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Call ID</p>
                <p className="text-sm font-mono text-foreground truncate max-w-xs">{callId.slice(0, 12)}...</p>
              </div>
              <button onClick={handleCopyCallId} className="p-1 hover:bg-muted rounded transition" title="Copy call ID">
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}

          <div className="h-8 w-px bg-border" />
          <div className="flex gap-2">
            <Link href="/">
              <Button size="icon" variant="ghost" title="Back to home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            <Button size="icon" variant="ghost">
              <Phone className="h-5 w-5" />
            </Button>
            <Button size="icon" variant="ghost">
              <Settings className="h-5 w-5" />
            </Button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
