'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { loadState, saveState, pct, estimateMCAPScore, estimateRITScore, getMCAPLabel, getRITLabel } from '@/lib/state'
import { AppState } from '@/lib/state'
import { MCAP_TOPICS, TOPIC_COLORS, TOPIC_LABELS, TOPIC_ICONS, TopicKey } from '@/lib/types'

const S = { bg:'#0f1117', surface:'#1a1d27', surface2:'#22263a', border:'#2e3350', muted:'#8b93b8' }

export default function ParentDashboard() {
  const [app, setApp] = useState<AppState | null>(null)
  const [sending, setSending] = useState(false)
  const [sendingReport, setSendingReport] = useState(false)
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
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ count:5, testType:'mixed' }),
      })
      const { questions } = await qRes.json()
      const twins = [
        { name:'Tim', email:app.emailConfig.timEmail, data:app.tim },
        { name:'Jason', email:app.emailConfig.jasonEmail, data:app.jason },
      ]
      let sent = 0
      for (const t of twins) {
        if (!t.email) continue
        const r = await fetch('/api/send-daily-email', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ name:t.name, email:t.email, questions, stats:{ streak:t.data.streak, weekQuestions:t.data.weekDays.filter(Boolean).length*5, points:t.data.points } }),
        })
        if (r.ok) sent++
      }
      showToast(sent>0?`✅ Sent to ${sent} student(s)!`:'❌ No emails sent — check addresses')
    } catch { showToast('❌ Error sending emails') }
    setSending(false)
  }

  async function sendWeeklyReport() {
    if (!app) return
    setSendingReport(true)
    try {
      const r = await fetch('/api/send-weekly-report', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ timData:app.tim, jasonData:app.jason }),
      })
      if (r.ok) showToast('📊 Weekly report sent to your email!')
      else showToast('❌ Error sending report')
    } catch { showToast('❌ Error sending report') }
    setSendingReport(false)
  }

  if (!app) return <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'system-ui' }}>Loading...</div>

  return (
    <div style={{ minHeight:'100vh', background:S.bg, padding:32, fontFamily:'system-ui', color:'white' }}>
      <div style={{ maxWidth:1000, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, margin:'0 0 4px' }}>👨‍👩‍👦 Parent Dashboard</h1>
            <p style={{ color:S.muted, margin:0 }}>⚡ Advanced 6th Grade Math — Tim & Jason</p>
          </div>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <button onClick={sendWeeklyReport} disabled={sendingReport}
              style={{ padding:'10px 18px', borderRadius:10, fontWeight:700, fontSize:13, background:'#6c63ff20', color:'#6c63ff', border:'1px solid #6c63ff40', cursor:'pointer', fontFamily:'system-ui' }}>
              {sendingReport?'⏳ Sending...':'📊 Send Weekly Report'}
            </button>
            <Link href="/" style={{ color:S.muted, fontSize:14, textDecoration:'none' }}>← Home</Link>
          </div>
        </div>

        {/* Twin comparison */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
          {(['tim','jason'] as const).map(t => {
            const d = app[t]
            const color = t==='tim'?'#6c63ff':'#ff6b9d'
            const mcap = estimateMCAPScore(d)
            const rit = estimateRITScore(d)
            const mcapC = mcap>=240?'#43e97b':mcap>=228?'#f7971e':'#ff6b9d'
            const ritC = rit>=228?'#43e97b':rit>=218?'#f7971e':'#ff6b9d'
            return (
              <div key={t} style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                  <div style={{ fontSize:20, fontWeight:900, color }}>{t==='tim'?'🧑‍🎓':'👨‍🎓'} {d.name}</div>
                  <div style={{ fontSize:13, color:S.muted }}>🔥 {d.streak} days · ⭐ {d.points} pts</div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { label:'MCAP', val:mcap>0?String(mcap):'---', sub:getMCAPLabel(mcap), c:mcapC },
                    { label:'MAP RIT', val:rit>0?String(rit):'---', sub:getRITLabel(rit), c:ritC },
                    { label:'This Week', val:`${d.weekDays.filter(Boolean).length*5}/35`, sub:'questions', c:'#43e97b' },
                  ].map(s => (
                    <div key={s.label} style={{ background:S.surface2, borderRadius:10, padding:12, textAlign:'center' }}>
                      <div style={{ fontSize:20, fontWeight:900, color:s.c }}>{s.val}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:S.muted }}>{s.label}</div>
                      <div style={{ fontSize:10, color:s.c, marginTop:2 }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {MCAP_TOPICS.map(topic => {
                  const s=d.stats[topic], p=pct(s), c=TOPIC_COLORS[topic]
                  return (
                    <div key={topic} style={{ marginBottom:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                        <span style={{ color:S.muted }}>{TOPIC_ICONS[topic]} {TOPIC_LABELS[topic]}</span>
                        <span style={{ fontWeight:700, color:c }}>{p}% ({s.correct}/{s.total})</span>
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
              { label:'Your Email (Weekly Reports)', field:'parentEmail', ph:'parent@email.com' },
            ].map(f => (
              <div key={f.field} style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:S.muted, marginBottom:6, textTransform:'uppercase' }}>{f.label}</div>
                <input type="email" placeholder={f.ph}
                  value={app.emailConfig[f.field as keyof typeof app.emailConfig]||''}
                  onChange={e => updateEmail(f.field, e.target.value)}
                  style={{ width:'100%', background:S.surface2, border:`1px solid ${S.border}`, borderRadius:10, padding:'10px 14px', fontSize:14, color:'white', outline:'none', fontFamily:'system-ui', boxSizing:'border-box' }} />
              </div>
            ))}
            <button onClick={sendEmails} disabled={sending}
              style={{ width:'100%', padding:'12px', borderRadius:10, fontWeight:700, fontSize:15, background:'linear-gradient(135deg,#ff6b9d,#c94080)', color:'white', border:'none', cursor:sending?'not-allowed':'pointer', opacity:sending?0.7:1, fontFamily:'system-ui', marginBottom:10 }}>
              {sending?'⏳ Sending...':'✉️ Send Today\'s Questions to Both'}
            </button>
            <button onClick={sendWeeklyReport} disabled={sendingReport}
              style={{ width:'100%', padding:'12px', borderRadius:10, fontWeight:700, fontSize:15, background:'linear-gradient(135deg,#6c63ff,#8b63ff)', color:'white', border:'none', cursor:sendingReport?'not-allowed':'pointer', opacity:sendingReport?0.7:1, fontFamily:'system-ui' }}>
              {sendingReport?'⏳ Sending...':'📊 Email Me Weekly Progress Report'}
            </button>
          </div>

          <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:20 }}>
            <div style={{ fontSize:18, fontWeight:900, marginBottom:16 }}>🔗 Quick Links</div>
            {[{name:'Tim',path:'tim'},{name:'Jason',path:'jason'}].map(s => (
              <div key={s.path} style={{ background:S.surface2, borderRadius:10, padding:14, marginBottom:10 }}>
                <div style={{ fontWeight:700, marginBottom:6 }}>{s.name==='Tim'?'🧑‍🎓':'👨‍🎓'} {s.name}'s Dashboard</div>
                <Link href={`/dashboard/${s.path}`} style={{ fontSize:12, fontWeight:700, color:'white', background:'#6c63ff', padding:'6px 14px', borderRadius:8, textDecoration:'none', display:'inline-block' }}>
                  Open →
                </Link>
              </div>
            ))}
            <div style={{ background:S.surface2, borderRadius:10, padding:14 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:10 }}>📅 Automated Schedule</div>
              <div style={{ fontSize:12, color:S.muted, lineHeight:2 }}>
                <div>📧 Daily questions → 9 AM every day</div>
                <div>📊 Weekly report → Every Sunday at 8 PM</div>
                <div>🎯 MCAP target → 240+ (advanced)</div>
                <div>📈 MAP target → RIT 228+ (advanced)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:S.surface, border:`1px solid ${S.border}`, borderRadius:12, padding:'12px 20px', fontWeight:700, fontSize:14, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100 }}>{toast}</div>}
    </div>
  )
}
