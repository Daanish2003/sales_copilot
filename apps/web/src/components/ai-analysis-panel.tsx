import { Card } from "@/components/ui/card"
import { AlertCircle, Lightbulb, Target, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/hooks/use-language"

interface AIAnalysisPanelProps {
  analysis: {
    concerns: string[]
    stage: string
    talkExample: string
    explanation: string
  }
  isActive: boolean
}

export default function AIAnalysisPanel({ analysis, isActive }: AIAnalysisPanelProps) {
  const { t } = useLanguage()

  const getStageBgColor = (stage: string) => {
    const stageColors: Record<string, string> = {
      "Initial Contact": "bg-slate-700",
      Qualification: "bg-blue-700",
      Presentation: "bg-purple-700",
      "Objection Handling": "bg-orange-700",
      Closing: "bg-green-700",
    }
    return stageColors[stage] || "bg-slate-700"
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Stage Card */}
      <Card className="border border-border bg-card/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          <p className="text-xs font-semibold text-muted-foreground">{t("conversationStage")}</p>
        </div>
        <div className={`rounded-lg ${getStageBgColor(analysis.stage)} px-3 py-2`}>
          <p className="text-sm font-bold text-white text-center">{analysis.stage}</p>
        </div>
      </Card>

      {/* Concerns Card */}
      <Card className="border border-border bg-card/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-400" />
          <p className="text-xs font-semibold text-muted-foreground">{t("identifiedConcerns")}</p>
        </div>
        <div className="space-y-2">
          {analysis.concerns.length > 0 ? (
            analysis.concerns.map((concern, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="bg-orange-900/30 text-orange-200 border-orange-700 block w-full text-center py-1"
              >
                {concern}
              </Badge>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">{t("noConcerns")}</p>
          )}
        </div>
      </Card>

      {/* Suggested Response Card */}
      <Card className="flex flex-1 flex-col border border-border bg-gradient-to-br from-blue-900/20 to-blue-800/20 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-yellow-400" />
          <p className="text-xs font-semibold text-muted-foreground">{t("suggestedResponse")}</p>
        </div>
        <div className="flex-1 rounded-lg bg-blue-950/50 border border-blue-800 p-3 mb-3">
          {analysis.talkExample ? (
            <p className="text-sm text-blue-100 leading-relaxed italic">"{analysis.talkExample}"</p>
          ) : (
            <p className="text-xs text-muted-foreground italic">{t("waitingForConversation")}</p>
          )}
        </div>
      </Card>

      {/* Explanation Card */}
      <Card className="border border-border bg-card/50 p-4">
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-green-400" />
          <p className="text-xs font-semibold text-muted-foreground">{t("whyThisResponse")}</p>
        </div>
        {analysis.explanation ? (
          <p className="text-xs leading-relaxed text-muted-foreground">{analysis.explanation}</p>
        ) : (
          <p className="text-xs text-muted-foreground italic">{t("analysisWillAppear")}</p>
        )}
      </Card>

      {/* Status Indicator */}
      <div className="rounded-lg border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isActive ? "bg-green-500 animate-pulse" : "bg-slate-600"}`} />
          <p className="text-xs text-muted-foreground">{isActive ? t("aiAnalyzing") : t("readyToStart2")}</p>
        </div>
      </div>
    </div>
  )
}
