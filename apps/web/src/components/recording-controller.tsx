"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Mic, MicOff } from "lucide-react"
import { useLanguage } from "@/hooks/use-language"

interface RecordingControlsProps {
  isRecording: boolean
  onToggle: () => void
}

export default function RecordingControls({ isRecording, onToggle }: RecordingControlsProps) {
  const { t } = useLanguage()

  return (
    <Card className="border border-border bg-card/50 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("microphoneControl")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRecording ? t("activelyListening") : t("readyToStart")}
          </p>
        </div>

        <Button
          onClick={onToggle}
          size="lg"
          variant={isRecording ? "destructive" : "default"}
          className="gap-2 w-full sm:w-auto"
        >
          {isRecording ? (
            <>
              <MicOff className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="text-sm sm:text-base">{t("stopRecording")}</span>
            </>
          ) : (
            <>
              <Mic className="h-4 sm:h-5 w-4 sm:w-5" />
              <span className="text-sm sm:text-base">{t("startRecording")}</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
