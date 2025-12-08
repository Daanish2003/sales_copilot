"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useLanguage } from "@/hooks/use-language"
import RecordingControls from "./recording-controls"
import AIAnalysisPanel from "./ai-analysis-panel"
import CallHeader from "./call-header"
import { useCallContext } from "@/hooks/use-call-context"
import RealTimeTranscriptFlow from "./real-time-transacription-flow"
import { translations } from "@/lib/i18n"

export default function CopilotDashboard() {
  const { language, t, get } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)

  const {
    transcript,
    analysis,
    addTranscriptEntry,
    updateAnalysis,
    callId,
    callDuration,
    isConnected,
    resetCallState,
  } = useCallContext()

  const hasSeededStaticConversation = useRef(false)

  // 🕒 format timer like "MM:SS" for header
  const formattedCallDuration = useMemo(() => {
    const mins = Math.floor(callDuration / 60)
      .toString()
      .padStart(2, "0")
    const secs = (callDuration % 60).toString().padStart(2, "0")
    return `${mins}:${secs}`
  }, [callDuration])

  // optional: when callId changes (new call / join), reset local context state
  useEffect(() => {
    resetCallState()
    hasSeededStaticConversation.current = false
  }, [callId, resetCallState])

  const mockConversationScenarios = useMemo(() => {
    const conversationRoot = get<Record<string, any>>("conversations", {})
    if (conversationRoot && typeof conversationRoot === "object") {
      return Object.values(conversationRoot)
    }
    return Object.values(translations[language]?.conversations ?? {})
  }, [get, language])

  useEffect(() => {
    if (hasSeededStaticConversation.current) return
    if (!mockConversationScenarios.length || transcript.length > 0) return

    const firstScenario = mockConversationScenarios[0]
    if (!firstScenario?.messages) return

    hasSeededStaticConversation.current = true
    firstScenario.messages.forEach((message: any, idx: number) => {
      setTimeout(() => {
        addTranscriptEntry({
          speaker: message.speaker,
          text: message.text,
          timestamp: Date.now(),
        })
        if (idx === firstScenario.messages.length - 1 && firstScenario.analysis) {
          updateAnalysis(firstScenario.analysis)
        }
      }, idx * 200)
    })
  }, [addTranscriptEntry, mockConversationScenarios, transcript.length, updateAnalysis])

  useEffect(() => {
    if (!isRecording) return

    let currentScenarioIndex = 0
    let currentMessageIndex = 0

    const interval = setInterval(() => {
      const scenario = mockConversationScenarios[currentScenarioIndex]
      const message = scenario?.messages?.[currentMessageIndex]

      if (message) {
        console.log("[v0] Adding transcript entry:", message)
        addTranscriptEntry({
          speaker: message.speaker,
          text: message.text,
          timestamp: Date.now(),
        })

        currentMessageIndex++

        if (currentMessageIndex % 2 === 0) {
          updateAnalysis(scenario.analysis)
        }

        if (currentMessageIndex >= scenario.messages.length) {
          currentScenarioIndex =
            (currentScenarioIndex + 1) % mockConversationScenarios.length
          currentMessageIndex = 0
        }
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [isRecording, addTranscriptEntry, updateAnalysis, mockConversationScenarios])

  const handleRecordingToggle = () => {
    setIsRecording(prev => !prev)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* 🔥 Now CallHeader can show live timer */}
      <CallHeader
        callId={callId}
        callDuration={formattedCallDuration}
        isActive={isConnected}
      />

      <div className="flex flex-1 gap-3 sm:gap-4 overflow-hidden p-3 sm:p-4 lg:p-6 flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Left side: Transcript and controls */}
        <div className="flex flex-col gap-3 sm:gap-4 flex-1 min-h-0">
          <div className="flex-1 min-h-0">
            <RealTimeTranscriptFlow />
          </div>
          <div className="shrink-0">
            <RecordingControls
              isRecording={isRecording}
              onToggle={handleRecordingToggle}
            />
          </div>
        </div>

        {/* Right side: AI Analysis - hidden on mobile, visible on desktop */}
        <div className="w-full lg:w-96 lg:shrink-0 min-h-0 overflow-hidden">
          <AIAnalysisPanel analysis={analysis} isActive={isRecording} />
        </div>
      </div>

      <div className="lg:hidden border-t border-border p-3 sm:p-4 max-h-96 overflow-y-auto bg-card/50">
        <AIAnalysisPanel analysis={analysis} isActive={isRecording} />
      </div>
    </div>
  )
}
