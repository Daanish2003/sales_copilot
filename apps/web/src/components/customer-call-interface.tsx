"use client"

import { useLanguage } from "@/hooks/use-language"
import { Phone, PhoneOff, Volume2, Mic, Copy, Check } from "lucide-react"
import { useState } from "react"
import { useCallContext } from "@/hooks/use-call-context"
import LanguageSwitcher from "./language-switcher"

interface CustomerCallInterfaceProps {
  isCallActive: boolean
  callDuration: string
  onEndCall: () => void
}

export default function CustomerCallInterface({ isCallActive, callDuration, onEndCall }: CustomerCallInterfaceProps) {
  const { t } = useLanguage()
  const { callId } = useCallContext()
  const [copied, setCopied] = useState(false)

  const handleCopyCallId = () => {
    if (callId) {
      navigator.clipboard.writeText(callId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-center relative">
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        <div className="text-white mb-2">
          <Phone className="w-12 h-12 mx-auto mb-3 opacity-80" />
          <p className="text-sm font-medium opacity-90">{t("call_in_progress", "Call in Progress")}</p>
        </div>
      </div>

      {/* Call Content */}
      <div className="p-8 text-center">
        {/* Agent Info */}
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <span className="text-white text-2xl font-bold">SA</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Sarah Anderson</h2>
          <p className="text-slate-600 text-sm">{t("real_estate_agent", "Real Estate Agent")}</p>
        </div>

        {/* Call Duration */}
        <div className="mb-8 p-4 bg-slate-50 rounded-lg">
          <p className="text-slate-600 text-xs font-medium mb-1">{t("call_duration", "Call Duration")}</p>
          <p className="text-4xl font-bold text-slate-900 font-mono">{callDuration}</p>
        </div>

        {/* Call ID Display */}
        {callId && (
          <div className="mb-8 p-3 bg-slate-100 rounded-lg flex items-center justify-center gap-2">
            <div className="text-left flex-1">
              <p className="text-xs text-slate-600 font-medium">Call ID</p>
              <p className="text-sm font-mono text-slate-900">{callId}</p>
            </div>
            <button
              onClick={handleCopyCallId}
              className="p-2 hover:bg-slate-200 rounded transition"
              title="Copy call ID"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-slate-600" />}
            </button>
          </div>
        )}

        {/* Status Indicator */}
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-sm text-slate-600">{t("call_connected", "Connected")}</p>
        </div>

        {/* Audio Indicators */}
        <div className="flex gap-4 mb-8 justify-center">
          <div className="flex flex-col items-center gap-2">
            <Volume2 className="w-5 h-5 text-slate-600" />
            <span className="text-xs text-slate-600">{t("speaker", "Speaker")}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Mic className="w-5 h-5 text-slate-600" />
            <span className="text-xs text-slate-600">{t("microphone", "Microphone")}</span>
          </div>
        </div>

        {/* End Call Button */}
        {isCallActive && (
          <button
            onClick={onEndCall}
            className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <PhoneOff className="w-5 h-5" />
            {t("end_call", "End Call")}
          </button>
        )}

        {!isCallActive && (
          <div className="p-4 bg-slate-100 rounded-lg">
            <p className="text-slate-700 font-medium">{t("call_ended", "Call Ended")}</p>
            <p className="text-sm text-slate-600 mt-1">{t("thank_you", "Thank you for speaking with us")}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4 bg-slate-50 text-center text-xs text-slate-600">
        <p>{t("copilot_powered", "Real Estate Sales Copilot")}</p>
      </div>
    </div>
  )
}
