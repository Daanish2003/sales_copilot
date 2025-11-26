import type React from "react"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface TranscriptEntry {
  speaker: "Agent" | "Client"
  text: string
  timestamp: number
}

interface CallContextType {
  callId: string
  userRole: "agent" | "customer"
  isConnected: boolean
  transcript: TranscriptEntry[]
  callDuration: number
  analysis: {
    concerns: string[]
    stage: string
    talkExample: string
    explanation: string
  }
  addTranscriptEntry: (entry: TranscriptEntry) => void
  updateAnalysis: (analysis: Partial<CallContextType["analysis"]>) => void
  startCall: () => void
  endCall: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({ children, role }: { children: React.ReactNode; role: "agent" | "customer" }) {
  const [callId, setCallId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [callDuration, setCallDuration] = useState(0)
  const [analysis, setAnalysis] = useState({
    concerns: [] as string[],
    stage: "Initial Contact",
    talkExample: "",
    explanation: "",
  })

  // Initialize call
  useEffect(() => {
    const initializeCall = async () => {
      const urlCallId = new URLSearchParams(window.location.search).get("callId")
      if (urlCallId) {
        setCallId(urlCallId)
      } else {
        const newCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setCallId(newCallId)
        // Update URL with call ID so other user can join
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set("callId", newCallId)
        window.history.replaceState({}, "", newUrl)
      }
      setIsConnected(true)
    }

    initializeCall()
  }, [])

  // Track call duration
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected])

  // Polling for shared state updates
  useEffect(() => {
    if (!isConnected || !callId) return

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/calls/${callId}`)
        if (response.ok) {
          const data = await response.json()
          if (data.transcript) {
            setTranscript(data.transcript)
          }
          if (data.analysis) {
            setAnalysis(data.analysis)
          }
        }
      } catch (error) {
        console.log("[v0] Polling error:", error)
      }
    }, 500)

    return () => clearInterval(pollInterval)
  }, [isConnected, callId])

  const addTranscriptEntry = useCallback(
    async (entry: TranscriptEntry) => {
      setTranscript((prev) => [...prev, entry])

      // Persist to API
      if (callId) {
        try {
          await fetch(`/api/calls/${callId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: [...transcript, entry] }),
          })
        } catch (error) {
          console.log("[v0] Error saving transcript:", error)
        }
      }
    },
    [callId, transcript],
  )

  const updateAnalysis = useCallback(
    async (newAnalysis: Partial<CallContextType["analysis"]>) => {
      const updated = { ...analysis, ...newAnalysis }
      setAnalysis(updated)

      // Persist to API
      if (callId) {
        try {
          await fetch(`/api/calls/${callId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ analysis: updated }),
          })
        } catch (error) {
          console.log("[v0] Error saving analysis:", error)
        }
      }
    },
    [callId, analysis],
  )

  const startCall = useCallback(() => {
    setIsConnected(true)
  }, [])

  const endCall = useCallback(() => {
    setIsConnected(false)
  }, [])

  return (
    <CallContext.Provider
      value={{
        callId,
        userRole: role,
        isConnected,
        transcript,
        callDuration,
        analysis,
        addTranscriptEntry,
        updateAnalysis,
        startCall,
        endCall,
      }}
    >
      {children}
    </CallContext.Provider>
  )
}

export function useCallContext() {
  const context = useContext(CallContext)
  if (!context) {
    throw new Error("useCallContext must be used within CallProvider")
  }
  return context
}
