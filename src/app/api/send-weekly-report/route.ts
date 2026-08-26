import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { timData, jasonData } = await req.json()
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    const parentEmail = process.env.PARENT_EMAIL
    if (!gmailUser || !gmailPass || !parentEmail) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'

    const topicLabels: Record<string, string> = {
      rational_numbers:'Rational Numbers', proportional:'Proportional Relationships',
      expressions_equations:'Expressions & Equations', geometry:'Geometry',
      statistics_probability:'Statistics & Probability',
    }
    const topicIcons: Record<string, string> = {
      rational_numbers:'➕➖', proportional:'📐', expressions_equations:'🔢',
      geometry:'📏', statistics_probability:'🎲',
    }

    function twinSection(name: string, data: { streak: number; points: number; stats: Record<string, { correct: number; total: number }>; weekDays: number[] }, color: string) {
      const weekQ = (data.weekDays || []).filter(Boolean).length * 5
      const mcapTopics = ['rational_numbers','proportional','expressions_equations','geometry','statistics_probability']
      const totalC = mcapTopics.reduce((s,t) => s + (data.stats[t]?.correct||0), 0)
      const totalQ = mcapTopics.reduce((s,t) => s + (data.stats[t]?.total||0), 0)
      const overall = totalQ ? Math.round(totalC/totalQ*100) : 0

      const weakTopics = mcapTopics
        .filter(t => (data.stats[t]?.total||0) >= 3 && (data.stats[t]?.correct||0)/(data.stats[t]?.total||1) < 0.65)
        .map(t => topicLabels[t])

      const topicRows = mcapTopics.map(t => {
        const s = data.stats[t] || { correct:0, total:0 }
        const p = s.total ? Math.round(s.correct/s.total*100) : 0
        const barColor = p >= 70 ? '#43e97b' : p >= 50 ? '#f7971e' : '#ff6b9d'
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
            <span style="color:#8b93b8">${topicIcons[t]} ${topicLabels[t]}</span>
            <span style="font-weight:700;color:${barColor}">${p}% (${s.correct}/${s.total})</span>
          </div>
          <div style="background:#22263a;border-radius:4px;height:6px">
            <div style="height:6px;border-radius:4px;width:${p}%;background:${barColor}"></div>
          </div>
        </div>`
      }).join('')

      return `
      <div style="background:#1a1d27;border-radius:14px;padding:20px;margin-bottom:16px;border-left:4px solid ${color}">
        <div style="font-size:18px;font-weight:900;color:${color};margin-bottom:12px">${name === 'Tim' ? '🧑‍🎓' : '👨‍🎓'} ${name}</div>
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <div style="flex:1;background:#22263a;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:800;color:#f7971e">🔥 ${data.streak||0}</div>
            <div style="font-size:10px;color:#8b93b8">Streak</div>
          </div>
          <div style="flex:1;background:#22263a;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:800;color:#43e97b">${weekQ}/35</div>
            <div style="font-size:10px;color:#8b93b8">This Week</div>
          </div>
          <div style="flex:1;background:#22263a;border-radius:8px;padding:10px;text-align:center">
            <div style="font-size:20px;font-weight:800;color:${overall>=70?'#43e97b':overall>=50?'#f7971e':'#ff6b9d'}">${overall}%</div>
            <div style="font-size:10px;color:#8b93b8">Overall</div>
          </div>
        </div>
        ${topicRows}
        ${weakTopics.length > 0 ? `<div style="background:#ff6b9d12;border:1px solid #ff6b9d30;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#ff6b9d">⚠️ Needs more practice: ${weakTopics.join(', ')}</div>` : `<div style="background:#43e97b12;border:1px solid #43e97b30;border-radius:8px;padding:10px;margin-top:12px;font-size:12px;color:#43e97b">✅ No major weak areas this week!</div>`}
      </div>`
    }

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="text-align:center;padding:24px;background:#1a1d27;border-radius:16px;margin-bottom:20px">
    <div style="font-size:32px;margin-bottom:8px">📊</div>
    <div style="font-size:22px;font-weight:800;color:#e8eaf6">Weekly Progress Report</div>
    <div style="color:#8b93b8;font-size:13px">Week of ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
  </div>
  <div style="background:#1a1d27;border-radius:12px;padding:16px;margin-bottom:16px;color:#8b93b8;font-size:13px;line-height:1.6">
    Here's how Tim and Jason did this week in Advanced 6th Grade Math. 
    <strong style="color:white">Topics needing extra attention</strong> are flagged below.
  </div>
  ${twinSection('Tim', timData, '#6c63ff')}
  ${twinSection('Jason', jasonData, '#ff6b9d')}
  <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#6c63ff,#ff6b9d);border-radius:14px">
    <div style="font-size:16px;font-weight:800;color:white;margin-bottom:12px">View Full Dashboard</div>
    <a href="${appUrl}/parent" style="display:inline-block;background:white;color:#6c63ff;padding:10px 24px;border-radius:8px;font-weight:800;font-size:14px;text-decoration:none">Open Parent Dashboard →</a>
  </div>
</div></body></html>`

    await transporter.sendMail({
      from: `"Math Academy" <${gmailUser}>`,
      to: parentEmail,
      subject: `📊 Weekly Math Report — Tim & Jason — ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Weekly report error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
