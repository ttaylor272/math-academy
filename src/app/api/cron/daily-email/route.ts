import { NextResponse } from 'next/server'
import { getCurrentUnit, upcomingAssessment, shortDate, todayET } from '@/lib/schedule'
export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'
    // Weekly rhythm:
    //   Mon/Wed/Fri → whatever unit White Oak is teaching right now
    //   Tue/Thu     → Maryland assessment skills (means, time, speed, ratios, area)
    //   Sat/Sun     → mixed advanced practice
    // In the 10 days before a district assessment, EVERY day drills that unit.
    const today = todayET()
    const [y, m, d] = today.split('-').map(Number)
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    const unit = getCurrentUnit(today)
    const exam = upcomingAssessment(10, today)

    let body: Record<string, unknown> = { count: 5, testType: 'mixed' }
    let focusNote = ''
    if (exam) {
      body = { count: 5, topic: exam.unit.topic }
      focusNote = `📝 Unit ${exam.unit.unit} District Assessment ${exam.days === 0 ? 'is TODAY' : exam.days === 1 ? 'is TOMORROW' : `in ${exam.days} days`} (${shortDate(exam.unit.assessment!)}) — today's questions are all ${exam.unit.title}.`
    } else if (unit && [1, 3, 5].includes(day)) {
      body = { count: 5, topic: unit.topic }
      focusNote = `🏫 Today's questions match what you're doing in class: Unit ${unit.unit}, ${unit.title}.`
    } else if (day === 2 || day === 4) {
      body = { count: 5, testType: 'md' }
    }

    const qRes = await fetch(`${appUrl}/api/generate-questions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
        body: JSON.stringify({ name: twin.name, email: twin.email, questions, focusNote, stats: { streak: 0, weekQuestions: 0, points: 0 } }),
      })
      results.push({ name: twin.name, status: r.ok ? 'sent' : 'failed' })
    }
    return NextResponse.json({ success: true, results })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
