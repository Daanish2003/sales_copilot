"use client"

import { Mic2, Phone, Settings, Home, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useLanguage } from "@/hooks/use-language"
import LanguageSwitcher from "./language-switcher"
import Link from "next/link"

interface CallHeaderProps {
  callId?: string
  callDuration?: string
  isActive?: boolean          // 👈 add this
}

export default function CallHeader({
  callId,
  callDuration = "00:00",
  isActive = true,            // 👈 safe default
}: CallHeaderProps) {
  const [copied, setCopied] = useState(false)
  const { t } = useLanguage()

  const handleCopyCallId = () => {
    if (callId) {
      navigator.clipboard.writeText(callId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="border-b border-border bg-card px-3 sm:px-4 md:px-6 py-3 sm:py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex h-8 sm:h-10 w-8 sm:w-10 items-center justify-center rounded-lg bg-primary flex-shrink-0">
            <Mic2 className="h-4 sm:h-5 w-4 sm:w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">
              {t("header.title")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {t("header.subtitle")}
            </p>
          </div>
        </div>

        {/* Duration and Call ID */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
          {/* Call Duration */}
          <div className="text-right">
            <p className="text-lg sm:text-2xl font-mono font-bold text-foreground">
              {callDuration}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("callDuration")}
            </p>
            {/* Optional: show status using isActive */}
            {/* <p className="text-[10px] text-muted-foreground">
              {isActive ? t("callStatus.active") : t("callStatus.ended")}
            </p> */}
          </div>

          {/* Call ID */}
          {callId && (
            <div className="hidden xs:flex px-2 sm:px-3 py-1 sm:py-2 bg-secondary rounded-lg border border-border items-center gap-1 sm:gap-2">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">ID</p>
                <p className="text-xs sm:text-sm font-mono text-foreground truncate max-w-xs">
                  {callId.slice(0, 10)}...
                </p>
              </div>
              <button
                onClick={handleCopyCallId}
                className="p-1 hover:bg-muted rounded transition flex-shrink-0"
                title="Copy call ID"
              >
                {copied ? (
                  <Check className="h-3 sm:h-4 w-3 sm:w-4 text-green-500" />
                ) : (
                  <Copy className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex gap-1 sm:gap-2 w-full sm:w-auto">
          <Link href="/" className="flex-1 sm:flex-none">
            <Button size="icon" variant="ghost" title="Back to home" className="w-full sm:w-auto">
              <Home className="h-4 sm:h-5 w-4 sm:w-5" />
            </Button>
          </Link>
          <Button size="icon" variant="ghost" title="Phone" className="flex-1 sm:flex-none">
            <Phone className="h-4 sm:h-5 w-4 sm:w-5" />
          </Button>
          <Button size="icon" variant="ghost" title="Settings" className="flex-1 sm:flex-none">
            <Settings className="h-4 sm:h-5 w-4 sm:w-5" />
          </Button>
          <div className="flex-1 sm:flex-none">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  )
}
