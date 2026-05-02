'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadState, saveState, pct, estimateMCAPScore, estimateRITScore, getMCAPLabel, getRITLabel } from '@/lib/state'
import { AppState } from '@/lib/state'
import { MCAP_TOPICS, MAP_TOPICS, TOPIC_COLORS, TOPIC_LABELS, TOPIC_ICONS, TopicKey } from '@/lib/types'

const S = { bg:'#0f1117', surface:'#1a1d27', surface2:'#22263a', border:'#2e3350', muted:'#8b93b8' }

export default function ParentDashboard() {
  const [app, setApp] = useState<AppState | null>(null)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => { setApp(loadState()) }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 4000) }

  function updateEmail(field: string, val: string) {
    setApp(prev => {
      if (!prev) return prev
      const next = { ...prev, emailConfig: { ...prev.emailConfig, [field]: val } }
      saveState(next); return next
    })
  }

  async function sendEmails() {
    if (!app) return
    setSending(true)
    try {
      const qRes = await fetch('/api/generate-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 5, testType: 'mixed' }),
      })
      const { questions } = await qRes.json()
      const twins = [
        { name: 'Tim', email: app.emailConfig.timEmail, data: app.tim },
        { name: 'Jason', email: app.emailConfig.jasonEmail, data: app.jason },
      ]
      let sent = 0
      for (const t of twins) {
        if (!t.email) continue
        const r = await fetch('/api/send-daily-email', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: t.name, email: t.email, questions, stats: { streak: t.data.streak, weekQuestions: t.data.weekDays.filter(Boolean).length * 5, points: t.data.points } }),
        })
        if (r.ok) sent++
        else { const err = await r.json(); console.error(err) }
      }
      showToast(sent > 0 ? `✅ Sent to ${sent} student(s)!` : '❌ No emails sent — check email addresses')
    } catch(e) { showToast('❌ Error sending emails'); console.error(e) }
    setSending(false)
  }

  if (!app) return <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white' }}>Loading...</div>

  return (
    <div style={{ minHeight:'100vh', background:S.bg, padding:32, fontFamily:'system-ui', color:'white' }}>
      <div style={{ maxWidth:960, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:'0 0 4px' }}>👨‍👩‍👦 Parent Dashboard</h1>
            <p style={{ color:S.muted, margin:0 }}>Manage Tim & Jason's Math Academy</p>
          </div>
          <Link href="/" style={{ color:S.muted, fontSize:14, textDecoration:'none' }}>← Home</Link>
        </div>

        {/* Twin comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          {(['tim','jason'] as const).map(t => {
            const d = app[t]
            const color = t === 'tim' ? '#6c63ff' : '#ff6b9d'
            const mcap = estimateMCAPScore(d)
            const rit = estimateRITScore(d)
            return (
              <div key={t} style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:900, color }}>{t==='tim'?'🧑‍🎓':'👨‍🎓'} {d.name}</div>
                  <div style={{ fontSize:13, color:S.muted }}>🔥 {d.streak} days · ⭐ {d.points} pts</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { label:'MCAP', val:mcap>0?String(mcap):'---', sub:getMCAPLabel(mcap), c:mcap>=230?'#43e97b':mcap>=220?'#f7971e':'#ff6b9d' },
                    { label:'MAP RIT', val:rit>0?String(rit):'---', sub:getRITLabel(rit), c:rit>=220?'#43e97b':rit>=210?'#f7971e':'#ff6b9d' },
                    { label:'This Week', val:`${d.weekDays.filter(Boolean).length*5}/35`, sub:'questions', c:'#43e97b' },
                  ].map(s => (
                    <div key={s.label} style={{ background:S.surface2, borderRadius:10, padding:12, textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.val}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:S.muted }}>{s.label}</div>
                      <div style={{ fontSize:10, color:s.c }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {[...MCAP_TOPICS.slice(0,3)].map(topic => {
                  const s = d.stats[topic], p = pct(s), c = TOPIC_COLORS[topic]
                  return (
                    <div key={topic} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                        <span style={{ color:S.muted }}>{TOPIC_ICONS[topic]} {TOPIC_LABELS[topic]}</span>
                        <span style={{ fontWeight:700, color:c }}>{p}%</span>
                      </div>
                      <div style={{ background:S.surface2, borderRadius:4, height:6 }}>
                        <div style={{ height:6, borderRadius:4, width:`${p}%`, background:c }} />
                      </div>
                    </div>
                  )
                })}
                <Link href={`/dashboard/${t}`} style={{ display:'block', marginTop:12, padding:'8px', borderRadius:10, textAlign:'center', fontSize:13, fontWeight:700, color, background:`${color}15`, border:`1px solid ${color}30`, textDecoration:'none' }}>
                  Open {d.name}'s Dashboard →
                </Link>
              </div>
            )
          })}
        </div>

        {/* Email setup */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
          <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
            <div style={{ fontSize:18, fontWeight:900, marginBottom:20 }}>📧 Email Setup</div>
            {[
              { label:"Tim's Email", field:'timEmail', ph:'tim@email.com' },
              { label:"Jason's Email", field:'jasonEmail', ph:'jason@email.com' },
              { label:'Your Email (Reports)', field:'parentEmail', ph:'parent@email.com' },
            ].map(f => (
              <div key={f.field} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:S.muted, marginBottom:6, textTransform:'uppercase' }}>{f.label}</div>
                <input type="email" placeholder={f.ph}
                  value={app.emailConfig[f.field as keyof typeof app.emailConfig] || ''}
                  onChange={e => updateEmail(f.field, e.target.value)}
                  style={{ width:'100%', background:S.surface2, border:`1px solid ${S.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, color:'white', outline:'none', fontFamily:'system-ui', boxSizing:'border-box' }} />
              </div>
            ))}
            <button onClick={sendEmails} disabled={sending}
              style={{ width:'100%', padding:'12px', borderRadius:10, fontWeight:700, fontSize:15, background:'linear-gradient(135deg,#ff6b9d,#c94080)', color:'white', border:'none', cursor:sending?'not-allowed':'pointer', opacity:sending?0.7:1, fontFamily:'system-ui', marginTop:8 }}>
              {sending ? '⏳ Sending...' : '✉️ Send Today\'s Questions Now'}
            </button>
            <div style={{ marginTop:12, padding:12, background:S.surface2, borderRadius:10, fontSize:12, color:S.muted }}>
              <div style={{ fontWeight:700, marginBottom:4 }}>📋 Emails send from your Gmail</div>
              <div>Make sure GMAIL_USER and GMAIL_APP_PASSWORD are set in Vercel env vars.</div>
            </div>
          </div>

          <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
            <div style={{ fontSize:18, fontWeight:900, marginBottom:16 }}>🔗 Student Links</div>
            {[{name:'Tim',path:'tim'},{name:'Jason',path:'jason'}].map(s => (
              <div key={s.path} style={{ background:S.surface2, borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{s.name === 'Tim' ? '🧑‍🎓' : '👨‍🎓'} {s.name}'s Dashboard</div>
                <div style={{ fontSize:12, color:'#6c63ff', wordBreak:'break-all', marginBottom:8 }}>
                  {process.env.NEXT_PUBLIC_APP_URL || 'your-app.vercel.app'}/dashboard/{s.path}
                </div>
                <Link href={`/dashboard/${s.path}`}
                  style={{ fontSize:12, fontWeight:700, color:'white', background:'#6c63ff', padding:'6px 14px', borderRadius:8, textDecoration:'none', display:'inline-block' }}>
                  Open →
                </Link>
              </div>
            ))}
            <div style={{ background:S.surface2, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:8 }}>✅ Setup Checklist</div>
              {[
                { label:'ANTHROPIC_API_KEY in Vercel', done:true },
                { label:'GMAIL_USER in Vercel', done:true },
                { label:'GMAIL_APP_PASSWORD in Vercel', done:true },
                { label:'TIM_EMAIL in Vercel', done:!!process.env.TIM_EMAIL },
                { label:'JASON_EMAIL in Vercel', done:!!process.env.JASON_EMAIL },
                { label:"Tim's email entered above", done:!!app.emailConfig.timEmail },
                { label:"Jason's email entered above", done:!!app.emailConfig.jasonEmail },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <span style={{ color:item.done?'#43e97b':'#555' }}>{item.done?'✓':'○'}</span>
                  <span style={{ fontSize:12, color:item.done?'white':S.muted }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div style={{ position:'fixed', bottom:24, right:24, background:S.surface, border:`1px solid ${S.border}`, borderRadius:12, padding:'12px 20px', fontWeight:700, fontSize:14, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100 }}>
          {toast}
        </div>
      )}
    </div>
  )
}
