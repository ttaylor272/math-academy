import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { name, email, questions, stats } = await req.json()
    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD
    if (!gmailUser || !gmailPass) return NextResponse.json({ error: 'Gmail not configured' }, { status: 500 })
    if (!email) return NextResponse.json({ error: 'No email address' }, { status: 400 })

    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } })
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'

    const topicEmoji: Record<string, string> = { ratios:'📐',number_system:'➕➖',expressions:'🔢',geometry:'📏',statistics:'📊',operations:'🧮',ratios_map:'📐',algebra_map:'🔢',geometry_map:'📏',data_map:'📊' }

    const questionsHtml = (questions || []).map((q: { topic: string; question: string; choices: string[] }, i: number) => `
      <div style="margin-bottom:18px;background:#1e2235;border-radius:10px;padding:16px;border-left:4px solid #6c63ff">
        <div style="color:#a09bff;font-size:11px;font-weight:700;margin-bottom:8px;text-transform:uppercase">${topicEmoji[q.topic]||'🧮'} ${q.topic.replace(/_/g,' ')}</div>
        <div style="font-size:14px;font-weight:700;color:#e8eaf6;margin-bottom:10px">${i+1}. ${q.question}</div>
        ${q.choices.map((c: string) => `<div style="padding:7px 10px;background:#22263a;border-radius:6px;color:#8b93b8;font-size:13px;margin-bottom:5px">${c}</div>`).join('')}
      </div>`).join('')

    const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif">
<div style="max-width:580px;margin:0 auto;padding:20px">
  <div style="text-align:center;padding:24px;background:#1a1d27;border-radius:14px;margin-bottom:18px">
    <div style="font-size:32px;margin-bottom:6px">🧠</div>
    <div style="font-size:22px;font-weight:800;color:#e8eaf6">Math Academy</div>
    <div style="color:#8b93b8;font-size:13px">Daily Questions for ${name}</div>
  </div>
  <div style="background:#1a1d27;border-radius:10px;padding:16px;margin-bottom:16px">
    <div style="font-size:16px;font-weight:700;color:#e8eaf6;margin-bottom:6px">Hey ${name}! 👋</div>
    <div style="color:#8b93b8;font-size:13px">Here are your 5 math questions for today. Answer them, then log in to check your answers!</div>
  </div>
  <div style="display:flex;gap:10px;margin-bottom:16px">
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:#f7971e">🔥 ${stats?.streak||0}</div><div style="font-size:10px;color:#8b93b8">Streak</div></div>
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:#43e97b">${stats?.weekQuestions||0}/35</div><div style="font-size:10px;color:#8b93b8">This Week</div></div>
    <div style="flex:1;background:#1a1d27;border-radius:8px;padding:10px;text-align:center"><div style="font-size:18px;font-weight:800;color:#ffd700">⭐ ${stats?.points||0}</div><div style="font-size:10px;color:#8b93b8">Points</div></div>
  </div>
  ${questionsHtml}
  <div style="text-align:center;padding:24px;background:linear-gradient(135deg,#6c63ff,#ff6b9d);border-radius:14px;margin-top:8px">
    <div style="font-size:16px;font-weight:800;color:white;margin-bottom:6px">Ready to check your answers?</div>
    <a href="${appUrl}/dashboard/${name.toLowerCase()}" style="display:inline-block;background:white;color:#6c63ff;padding:10px 24px;border-radius:8px;font-weight:800;font-size:14px;text-decoration:none">Open Math Academy →</a>
  </div>
</div></body></html>`

    await transporter.sendMail({
      from: `"Math Academy" <${gmailUser}>`,
      to: email,
      subject: `📚 ${name}'s Math Questions — ${new Date().toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})}`,
      html,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Email error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
