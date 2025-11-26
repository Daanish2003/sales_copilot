import { useState, useEffect } from "react"
import { useLanguage } from "@/hooks/use-language"
import RecordingControls from "./recording-controls"
import TranscriptPanel from "./transcript-panel"
import AIAnalysisPanel from "./ai-analysis-panel"
import CallHeader from "./call-header"
import { useCallContext } from "@/hooks/use-call-context"

export default function CopilotDashboard() {
  const { language } = useLanguage()
  const [isRecording, setIsRecording] = useState(false)
  const { transcript, analysis, addTranscriptEntry, updateAnalysis, callId } = useCallContext()

  const mockTranscriptData = [
    {
      speaker: "Agent" as const,
      text: "Good morning! Thanks for calling us today. How can I help you find your perfect home?",
    },
    {
      speaker: "Client" as const,
      text: "Hi, we're looking for a 3-bedroom house in the downtown area, preferably with a yard.",
    },
    {
      speaker: "Agent" as const,
      text: "That's great! The downtown area has some excellent properties right now. What's your budget range?",
    },
    { speaker: "Client" as const, text: "We're looking to spend around 500k to 600k." },
    {
      speaker: "Agent" as const,
      text: "Perfect! We have several properties in that range. Are you currently in a position to make a move soon?",
    },
  ]

  const mockAnalysis = {
    concerns: ["Budget constraints", "Specific location preference", "Timeline unclear"],
    stage: "Qualification",
    talkExample:
      "Let me show you 3 properties that match your criteria perfectly. They're all in prime downtown locations with excellent yard spaces.",
    explanation: "Client has clear preferences and budget. Focus on timeline and motivations to move forward.",
  }

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * mockTranscriptData.length)
        const newEntries = mockTranscriptData.slice(0, randomIndex + 1)

        // Add new transcript entry
        if (newEntries.length > transcript.length) {
          const newEntry = newEntries[newEntries.length - 1]
          addTranscriptEntry({
            speaker: newEntry.speaker,
            text: newEntry.text,
            timestamp: Date.now(),
          })
        }

        // Update analysis
        updateAnalysis(mockAnalysis)
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [isRecording, transcript.length, addTranscriptEntry, updateAnalysis])

  const handleRecordingToggle = () => {
    setIsRecording(!isRecording)
  }

  const transcriptDisplay = transcript.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n")

  return (
    <div className="flex h-screen flex-col bg-background">
      <CallHeader callId={callId} />

      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Main Transcript Area */}
        <div className="flex flex-1 flex-col gap-4">
          <TranscriptPanel transcript={[transcriptDisplay]} />
          <RecordingControls isRecording={isRecording} onToggle={handleRecordingToggle} />
        </div>

        {/* AI Analysis Sidebar */}
        <div className="w-80">
          <AIAnalysisPanel analysis={analysis} isActive={isRecording} />
        </div>
      </div>
    </div>
  )
}
