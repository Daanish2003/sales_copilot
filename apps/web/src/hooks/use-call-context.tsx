"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface TranscriptEntry {
  speaker: "Agent" | "Client"
  text: string
  timestamp: number
}

const INITIAL_ANALYSIS = {
  concerns: [] as string[],
  stage: "Initial Contact",
  talkExample: "",
  explanation: "",
}

interface CallContextType {
  callId: string
  userRole: "agent" | "customer"
  isConnected: boolean
  transcript: TranscriptEntry[]
  callDuration: number
  analysis: typeof INITIAL_ANALYSIS

  addTranscriptEntry: (entry: TranscriptEntry) => void
  updateAnalysis: (analysis: Partial<CallContextType["analysis"]>) => void

  startCall: (opts?: { callId?: string }) => void
  endCall: () => void

  // 🔽 new helpers for resetting state
  resetTranscript: () => void
  resetAnalysis: () => void
  resetCallState: () => void
}

const CallContext = createContext<CallContextType | undefined>(undefined)

export function CallProvider({
  children,
  role,
}: {
  children: React.ReactNode
  role: "agent" | "customer"
}) {
  const [callId, setCallId] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([])
  const [callDuration, setCallDuration] = useState(0)
  const [analysis, setAnalysis] = useState(INITIAL_ANALYSIS)

  // Initialize call (first mount)
  useEffect(() => {
    const initializeCall = () => {
      const urlCallId = new URLSearchParams(window.location.search).get("callId")

      const newCallId =
        urlCallId ?? `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      setCallId(newCallId)

      if (!urlCallId) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set("callId", newCallId)
        window.history.replaceState({}, "", newUrl)
      }

      setIsConnected(true)
    }

    initializeCall()
  }, [])

  // Track call duration while connected
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected])

  const addTranscriptEntry = useCallback((entry: TranscriptEntry) => {
    setTranscript(prev => [...prev, entry])
  }, [])

  const updateAnalysis = useCallback((newAnalysis: Partial<CallContextType["analysis"]>) => {
    setAnalysis(prev => ({ ...prev, ...newAnalysis }))
  }, [])

  // 🔽 Reset helpers
  const resetTranscript = useCallback(() => {
    setTranscript([])
  }, [])

  const resetAnalysis = useCallback(() => {
    setAnalysis(INITIAL_ANALYSIS)
  }, [])

  const resetCallState = useCallback(() => {
    setTranscript([])
    setCallDuration(0)
    setAnalysis(INITIAL_ANALYSIS)
  }, [])

  // Start a new call (optionally with a specific callId)
  const startCall = useCallback((opts?: { callId?: string }) => {
    const newCallId =
      opts?.callId ?? `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    setCallId(newCallId)
    setIsConnected(true)
    setTranscript([])
    setCallDuration(0)
    setAnalysis(INITIAL_ANALYSIS)

    // update URL
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set("callId", newCallId)
    window.history.replaceState({}, "", newUrl)
  }, [])

  const endCall = useCallback(() => {
    setIsConnected(false)
    // you can choose to keep transcript/analysis or clear them here
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
        resetTranscript,
        resetAnalysis,
        resetCallState,
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
