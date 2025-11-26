import { LanguageProvider, useLanguage } from "@/hooks/use-language"
import { ArrowRight, Headphones, Users } from "lucide-react"
import { useState } from "react"
import LanguageSwitcher from "@/components/language-switcher"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function HomeContent() {
  const { t } = useLanguage()
  const [joinCallId, setJoinCallId] = useState("")
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"agent" | "customer" | null>(null)

  const handleContinue = (baseUrl: string) => {
    let callId = joinCallId.trim()

    // If no call ID provided, generate a new one
    if (!callId) {
      callId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    window.location.href = `${baseUrl}?callId=${callId}`
  }

  const handleRoleClick = (role: "agent" | "customer") => {
    setSelectedRole(role)
    setShowJoinModal(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="fixed top-4 right-4 z-40">
        <LanguageSwitcher />
      </div>

      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRole === "agent" ? t("sales_agent", "Sales Agent") : t("customer", "Customer")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="call-id">{t("call_id_label", "Call ID (optional)")}</Label>
              <Input
                id="call-id"
                value={joinCallId}
                onChange={(e) => setJoinCallId(e.target.value)}
                placeholder={t("call_id_placeholder", "Enter call ID to join existing call")}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                {t("empty_starts_new", "Leave empty to start a new call")}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowJoinModal(false)
                setSelectedRole(null)
                setJoinCallId("")
              }}
            >
              {t("cancel", "Cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const baseUrl = selectedRole === "agent" ? "/agent" : "/customer"
                handleContinue(baseUrl)
              }}
            >
              {t("continue", "Continue")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <Headphones className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-foreground mb-4">{t("sales_copilot", "Real Estate Sales Copilot")}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t("ai_powered_guidance", "AI-Powered Real-Time Sales Guidance")}
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Agent Option */}
          <Card
            onClick={() => handleRoleClick("agent")}
            className="group cursor-pointer hover:border-primary/50 transition-all p-8"
          >
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Headphones className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t("sales_agent", "Sales Agent")}</h2>
            <p className="text-muted-foreground mb-6">
              {t("agent_desc", "Access real-time AI guidance, customer analysis, and recommended next steps")}
            </p>
            <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
              <span className="font-semibold">{t("launch", "Launch")}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Card>

          {/* Customer Option */}
          <Card
            onClick={() => handleRoleClick("customer")}
            className="group cursor-pointer hover:border-primary/50 transition-all p-8"
          >
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">{t("customer", "Customer")}</h2>
            <p className="text-muted-foreground mb-6">{t("customer_desc", "Join a call with our sales agent")}</p>
            <div className="flex items-center text-primary group-hover:translate-x-2 transition-transform">
              <span className="font-semibold">{t("launch", "Launch")}</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </div>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="mt-16 p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("select_role", "Select your role above to begin")}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {t("call_id_info", "Both users will share the same call ID to connect in real-time")}
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeContent />
    </LanguageProvider>
  )
}
