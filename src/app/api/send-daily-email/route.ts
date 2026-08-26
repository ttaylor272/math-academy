import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { name, email, questions, stats } = await req.json()
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (!gmailUser || !gmailPass) return NextResponse.json({ error: 'Gmail not configured' }, { status: 500 })
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'

    const topicEmoji: Record<string, string> = {
      rational_numbers:'➕➖', proportional:'📐', expressions_equations:'🔢',
      geometry:'📏', statistics_probability:'🎲', number_operations:'🧮',
      ratio_proportion:'📐', algebra:'🔢', geometry_adv:'📏', data_probability:'🎲',
    }
    const topicLabel: Record<string, string> = {
      rational_numbers:'Rational Numbers', proportional:'Proportional Relationships',
      expressions_equations:'Expressions & Equations', geometry:'Geometry',
      statistics_probability:'Statistics & Probability', number_operations:'Number & Operations',
      ratio_proportion:'Ratios & Proportional', algebra:'Algebra & Functions',
      geometry_adv:'Geometry & Measurement', data_probability:'Data & Probability',
    }

    const questionsHtml = (questions || []).map((q: { topic: string; subtopic?: string; question: string; choices: string[] }, i: number) => `
      <div style="margin-bottom:20px;background:#1e2235;border-radius:12px;padding:18px;border-left:4px solid #6c63ff">
        <div style="color:#a09bff;font-size:11px;font-weight:700;margin-bottom:8px;text-transform:uppercase">
          ${topicEmoji[q.topic]||'🧮'} ${q.subtopic || topicLabel[q.topic] || q.topic}
        </div>
        <div style="font-size:15px;font-weight:700;color:#e8eaf6;margin-bottom:12px;line-height:1.5">${i+1}. ${q.question}</div>
        ${q.choices.map((c: string) => `<div style="padding:8px 12px;background:#22263a;border-radius:6px;color:#8b93b8;font-size:13px;margin-bottom:6px">${c}</div>`).join('')}
      </div>`).join('')

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">
  <div style="text-align:center;padding:28px;background:#1a1d27;border-radius:16px;margin-bottom:20px">
    <div style="font-size:36px;margin-bottom:8px">🧠</div>
    <div style="font-size:22px;font-weight:800;color:#e8eaf6;margin-bottom:4px">Math Academy</div>
    <div style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#ff6b9d);border-radius:12px;padding:3px 12px;font-size:11px;font-weight:700;color:white;margin-bottom:6px">⚡ Advanced 6th Grade</div>
    <div style="color:#8b93b8;font-size:13px">Daily Questions for ${name}</div>
  </div>
  <div style="background:#1a1d27;border-radius:12px;padding:18px;margin-bottom:16px">
    <div style="font-size:17px;font-weight:700;color:#e8eaf6;margin-bottom:6px">Hey ${name}! 👋</div>
    <div style="color:#8b93b8;font-size:14px;line-height:1.6">Here are your <strong style="color:#6c63ff">5 advanced math questions</strong> for today. These are 7th grade level — you've got this! Answer them on paper first, then log in to check.</div>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:18px">
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:#f7971e">🔥 ${stats?.streak||0}</div><div style="font-size:10px;color:#8b93b8">Streak</div></div>
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:#43e97b">${stats?.weekQuestions||0}/35</div><div style="font-size:10px;color:#8b93b8">This Week</div></div>
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:12px;text-align:center"><div style="font-size:20px;font-weight:800;color:#ffd700">⭐ ${stats?.points||0}</div><div style="font-size:10px;color:#8b93b8">Points</div></div>
  </div>
  ${questionsHtml}
  <div style="text-align:center;padding:28px;background:linear-gradient(135deg,#6c63ff,#ff6b9d);border-radius:16px;margin-top:8px">
    <div style="font-size:17px;font-weight:800;color:white;margin-bottom:6px">Check your answers & see explanations!</div>
    <div style="color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:16px">Log in to Math Academy — use the concept cards if you need a reminder!</div>
    <a href="${appUrl}/dashboard/${name.toLowerCase()}" style="display:inline-block;background:white;color:#6c63ff;padding:12px 28px;border-radius:10px;font-weight:800;font-size:15px;text-decoration:none">Open Math Academy →</a>
  </div>
  <div style="text-align:center;margin-top:20px;color:#444;font-size:11px">Math Academy · Advanced 6th Grade Prep for ${name}</div>
</div></body></html>`

    await transporter.sendMail({
      from: `"Math Academy" <${gmailUser}>`,
      to: email,
      subject: `⚡ ${name}'s Advanced Math Questions — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}`,
      html,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
