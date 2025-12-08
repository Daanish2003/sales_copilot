"use client"

import { Phone, PhoneOff, Volume2, Mic, Copy, Check, Clock, Globe } from "lucide-react"
import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface CustomerCallInterfaceProps {
  isCallActive?: boolean
  callDuration?: string
  onEndCall?: () => void
}

export default function CustomerCallInterface({
  isCallActive = true,
  callDuration = "02:24",
  onEndCall = () => {},
}: CustomerCallInterfaceProps) {
  const [callId] = useState("call_1765192431135_1Kk1u9qs2")
  const [copied, setCopied] = useState(false)
  const [micActive, setMicActive] = useState(true)
  const [speakerActive, setSpeakerActive] = useState(true)

  const handleCopyCallId = () => {
    if (callId) {
      navigator.clipboard.writeText(callId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      {/* Top Right Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <Button variant="outline" size="icon">
          <Globe className="w-4 h-4" />
        </Button>
      </div>

      {/* Main Call Card */}
      <Card className="w-full max-w-md py-0">
        {/* Header with Call Status */}
        <CardHeader className="bg-linear-to-r from-primary to-blue-600 text-primary-foreground p-3 text-center rounded-t-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary-foreground/20 rounded-full animate-pulse" />
              <Phone className="w-8 h-8 relative z-10" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">
                通話中
              </p>
              <h1 className="text-lg font-semibold">
                Connected with Sales Agent
              </h1>
            </div>
          </div>
        </CardHeader>

        {/* Content area */}
        <CardContent className="p-3 space-y-2">
          {/* Agent Info Card */}
          <Card className="bg-secondary border">
            <CardContent className="p-4 text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary">
                <span className="text-2xl font-bold text-primary">SA</span>
              </div>
              <h2 className="text-lg font-bold text-foreground">Sarah Anderson</h2>
              <p className="text-sm text-muted-foreground mt-1">
                不動産営業担当者
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Luxury Properties Specialist
              </p>
            </CardContent>
          </Card>

          {/* Call Duration - Prominent Display */}
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-2 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  通話時間
                </p>
              </div>
              <p className="text-3xl font-bold font-mono text-foreground">
                {callDuration}
              </p>
            </CardContent>
          </Card>

          {/* Call ID Display */}
          {callId && (
            <Card className="bg-muted py-1">
              <CardContent className="py-1 flex items-center justify-between gap-3">
                <div className="text-left flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
                    CALL ID
                  </p>
                  <p className="text-xs font-mono text-foreground truncate">
                    {callId}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleCopyCallId}
                  className="h-8 w-8 shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Audio Status Indicators */}
          <div className="grid grid-cols-2 gap-3">
            <Card className={micActive ? "bg-primary/10 border-primary/30 py-1" : ""}>
              <CardContent className="flex flex-col items-center gap-2 p-2">
                <Mic
                  className={`w-5 h-5 ${
                    micActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-xs font-medium text-foreground">
                  マイク
                </span>
                <span className="text-xs text-muted-foreground">
                  {micActive ? "On" : "Off"}
                </span>
              </CardContent>
            </Card>
            <Card className={speakerActive ? "bg-primary/10 border-primary/30 py-1" : ""}>
              <CardContent className="flex flex-col items-center gap-2 p-2">
                <Volume2
                  className={`w-5 h-5 ${
                    speakerActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
                <span className="text-xs font-medium text-foreground">
                  スピーカー
                </span>
                <span className="text-xs text-muted-foreground">
                  {speakerActive ? "On" : "Off"}
                </span>
              </CardContent>
            </Card>
          </div>

          {/* End Call / Ended State */}
          {isCallActive ? (
            <Button
              onClick={onEndCall}
              variant="destructive"
              className="w-full gap-2 h-11"
            >
              <PhoneOff className="w-5 h-5" />
              通話を終了
            </Button>
          ) : (
            <Card className="bg-secondary">
              <CardContent className="p-4 text-center">
                <p className="font-medium text-foreground">
                  Call Ended
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thank you for speaking with us
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>

        {/* Footer */}
        <CardFooter className="border-t bg-muted/50 p-4 text-center rounded-b-lg">
          <p className="text-xs text-muted-foreground font-medium w-full">
            Real Estate Sales Copilot
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}