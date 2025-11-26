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
    <Card className="border border-border bg-card/50 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t("microphoneControl")}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRecording ? t("activelyListening") : t("readyToStart")}
          </p>
        </div>

        <Button onClick={onToggle} size="lg" variant={isRecording ? "destructive" : "default"} className="gap-2">
          {isRecording ? (
            <>
              <MicOff className="h-5 w-5" />
              {t("stopRecording")}
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              {t("startRecording")}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
