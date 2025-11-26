"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useRef } from "react"
import { Mic, User } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface TranscriptPanelProps {
  transcript: string[]
}

export default function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const parseTranscript = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim())
    return lines.map((line, idx) => {
      const [speaker, ...rest] = line.split(": ")
      const message = rest.join(": ")
      const isAgent = speaker === "Agent"

      return (
        <div key={idx} className="mb-4 flex gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
              isAgent ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-100"
            }`}
          >
            {isAgent ? <Mic className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-muted-foreground">{speaker}</p>
            <p className={`mt-1 text-sm leading-relaxed ${isAgent ? "text-blue-200" : "text-foreground"}`}>{message}</p>
          </div>
        </div>
      )
    })
  }

  return (
    <Card className="flex-1 flex flex-col border border-border bg-card/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{t("liveTranscript")}</h2>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs text-muted-foreground">{t("recording")}</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-2">
        {transcript.length > 0 ? (
          parseTranscript(transcript[0])
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">{t("noConversation")}</p>
          </div>
        )}
      </div>

      <div className="mt-4 border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">
          {transcript.length > 0 ? `${transcript[0].split("\n").length} ${t("exchanges")}` : t("noExchanges")}
        </p>
      </div>
    </Card>
  )
}
