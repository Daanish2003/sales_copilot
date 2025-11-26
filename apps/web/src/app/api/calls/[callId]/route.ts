import { type NextRequest, NextResponse } from "next/server"

// In-memory store for call data (in production, use a database)
const callStore = new Map<
  string,
  {
    transcript: Array<{ speaker: string; text: string; timestamp: number }>
    analysis: { concerns: string[]; stage: string; talkExample: string; explanation: string }
    createdAt: number
  }
>()

// Cleanup old calls every 5 minutes
setInterval(
  () => {
    const now = Date.now()
    for (const [callId, data] of callStore.entries()) {
      if (now - data.createdAt > 5 * 60 * 1000) {
        callStore.delete(callId)
      }
    }
  },
  5 * 60 * 1000,
)

export async function GET(request: NextRequest, { params }: { params: { callId: string } }) {
  const callId = params.callId

  if (!callStore.has(callId)) {
    callStore.set(callId, {
      transcript: [],
      analysis: { concerns: [], stage: "Initial Contact", talkExample: "", explanation: "" },
      createdAt: Date.now(),
    })
  }

  const callData = callStore.get(callId)
  return NextResponse.json(callData)
}

export async function POST(request: NextRequest, { params }: { params: { callId: string } }) {
  const callId = params.callId
  const body = await request.json()

  if (!callStore.has(callId)) {
    callStore.set(callId, {
      transcript: [],
      analysis: { concerns: [], stage: "Initial Contact", talkExample: "", explanation: "" },
      createdAt: Date.now(),
    })
  }

  const callData = callStore.get(callId)!

  if (body.transcript) {
    callData.transcript = body.transcript
  }

  if (body.analysis) {
    callData.analysis = body.analysis
  }

  return NextResponse.json({ success: true })
}
