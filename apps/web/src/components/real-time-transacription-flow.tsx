"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/hooks/use-language"
import { useCallContext } from "@/hooks/use-call-context"
import { MessageCircle, CheckCircle2, Clock } from "lucide-react"
import { useEffect, useMemo, useRef } from "react"

interface TranscriptEntry {
  speaker: "Agent" | "Client"
  text: string
  timestamp: number
  stage?: string
}

export default function RealTimeTranscriptFlow() {
  const { t, get } = useLanguage()
  const { transcript } = useCallContext()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [transcript])

  const stages = useMemo(() => {
    const candidate = get<unknown>("stagesOrder")
    if (Array.isArray(candidate) && candidate.length) return candidate
    return [
      get<string>("stages.initial_contact", "Initial Contact"),
      get<string>("stages.qualification", "Qualification"),
      get<string>("stages.presentation", "Presentation"),
      get<string>("stages.objection_handling", "Objection Handling"),
      get<string>("stages.closing", "Closing"),
    ]
  }, [get])
  const currentStageIndex = Math.min(Math.floor(transcript.length / 2), stages.length - 1)
  const currentStage = stages[currentStageIndex]

  return (
    <Card className="flex flex-col border border-border bg-card h-[720px]">
      {/* Header */}
      <div className="border-b border-border p-4 sm:p-6 shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{t("liveTranscript", "Live Transcript")}</h2>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs text-muted-foreground">{t("recording", "Recording in progress")}</p>
        </div>
      </div>

      {/* Conversation Flow */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
        {transcript.length > 0 ? (
          transcript.map((entry, idx) => (
            <div key={idx} className="flex gap-3 animate-fade-in">
              {/* Avatar */}
              <div
                className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                  entry.speaker === "Agent" ? "bg-primary" : "bg-secondary"
                }`}
              >
                {entry.speaker === "Agent" ? "A" : "C"}
              </div>

              {/* Message Bubble */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {entry.speaker === "Agent" ? t("sales_agent", "Sales Agent") : t("customer", "Customer")}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-lg ${
                    entry.speaker === "Agent"
                      ? "bg-primary/10 border border-primary/20 text-foreground"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  <p className="text-sm leading-relaxed wrap-break-words">{entry.text}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">
              {t("noConversation", "No conversation yet. Start recording to begin.")}
            </p>
          </div>
        )}
      </div>

      {/* Conversation Stage Progress */}
      <div className="border-t border-border p-4 sm:p-6 bg-muted/50 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Conversation Stage</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {stages.map((stage, idx) => (
            <Badge
              key={idx}
              className={`transition-all ${
                idx <= currentStageIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              variant={idx <= currentStageIndex ? "default" : "secondary"}
            >
              {idx < currentStageIndex && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {stage}
            </Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}