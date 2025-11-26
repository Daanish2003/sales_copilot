"use client"

import { LanguageProvider } from "@/hooks/use-language"
import CopilotDashboard from "@/components/copilot-dashboard"
import { CallProvider } from "@/hooks/use-call-context"

export default function AgentPage() {
  return (
    <CallProvider role="agent">
      <LanguageProvider>
        <main className="min-h-screen bg-background">
          <CopilotDashboard />
        </main>
      </LanguageProvider>
    </CallProvider>
  )
}
