import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'
    const qRes = await fetch(`${appUrl}/api/generate-questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: 5, testType: 'mixed' }),
    })
    const { questions } = await qRes.json()
    const twins = [
      { name: 'Tim', email: process.env.TIM_EMAIL },
      { name: 'Jason', email: process.env.JASON_EMAIL },
    ]
    const results = []
    for (const twin of twins) {
      if (!twin.email) { results.push({ name: twin.name, status: 'skipped' }); continue }
      const r = await fetch(`${appUrl}/api/send-daily-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: twin.name, email: twin.email, questions, stats: { streak: 0, weekQuestions: 0, points: 0 } }),
      })
      results.push({ name: twin.name, status: r.ok ? 'sent' : 'failed' })
    }
    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
