'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Twin, Question, TwinData, TopicKey,
  TWIN_COLORS, TOPIC_COLORS, TOPIC_LABELS, TOPIC_ICONS,
  MCAP_TOPICS, MAP_TOPICS,
} from '@/lib/types'
import {
  loadState, saveState, AppState, pct,
  estimateMCAPScore, estimateRITScore, getMCAPLabel, getRITLabel, getWeakTopics
} from '@/lib/state'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
type Page = 'dashboard' | 'practice' | 'mcap_test' | 'map_test'
type QuizMode = 'timed' | 'review'
type TestFocus = 'mcap' | 'map' | 'mixed'

interface SessionResult { correct: boolean; selected: number; question: Question }

// ─── COLOURS / THEME ───────────────────────────────────────────
const S = {
  bg: '#0f1117', surface: '#1a1d27', surface2: '#22263a',
  border: '#2e3350', text: '#e8eaf6', muted: '#8b93b8',
  green: '#43e97b', orange: '#f7971e', pink: '#ff6b9d', blue: '#6c63ff',
}
const card = (extra = ''): React.CSSProperties => ({
  background: S.surface, border: `1px solid ${S.border}`,
  borderRadius: 16, padding: 24, ...JSON.parse(extra || '{}'),
})

export default function TwinDashboard() {
  const [twin, setTwin] = useState<Twin | null>(null)
  const [app, setApp] = useState<AppState | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessCorrect, setSessCorrect] = useState(0)
  const [results, setResults] = useState<SessionResult[]>([])
  const [qMode, setQMode] = useState<QuizMode>('review')
  const [timer, setTimer] = useState(30)
  const [timerOn, setTimerOn] = useState(false)
  const [testCorrect, setTestCorrect] = useState(0)
  const [toast, setToast] = useState('')
  const [dashTab, setDashTab] = useState<'mcap'|'map'>('mcap')
  const [followUp, setFollowUp] = useState('')
  const [loadingFollowUp, setLoadingFollowUp] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)

  useEffect(() => {
    const parts = window.location.pathname.split('/')
    const t = parts[parts.length - 1] as Twin
    setTwin(t === 'tim' || t === 'jason' ? t : null)
    setApp(loadState())
  }, [])

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setApp(prev => { if (!prev) return prev; const n = fn(prev); saveState(n); return n })
  }, [])

  // timer
  useEffect(() => {
    if (!timerOn) return
    if (timer <= 0) { setTimerOn(false); doAutoSkip(); return }
    const t = setTimeout(() => setTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timerOn, timer])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  if (!twin && app !== null) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>❌</div>
        <p style={{ marginBottom:16 }}>Unknown student. Use /dashboard/tim or /dashboard/jason</p>
        <Link href="/" style={{ color:S.blue }}>← Home</Link>
      </div>
    </div>
  )
  if (!twin || !app) return (
    <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:20, fontFamily:'system-ui' }}>Loading...</div>
  )

  const data: TwinData = app[twin]
  const color = TWIN_COLORS[twin].primary
  const mcap = estimateMCAPScore(data)
  const rit = estimateRITScore(data)
  const mcapC = mcap === 0 ? S.muted : mcap >= 230 ? S.green : mcap >= 220 ? S.orange : S.pink
  const ritC = rit === 0 ? S.muted : rit >= 220 ? S.green : rit >= 210 ? S.orange : S.pink
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  // ── question generation ──────────────────────────────────────
  async function genQ(opts: { topic?: string; count?: number; difficulty?: string; testType?: string }) {
    setLoading(true)
    try {
      const r = await fetch('/api/generate-questions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...opts, ritLevel: rit || 215 }),
      })
      const { questions: qs, error } = await r.json()
      if (error) throw new Error(error)
      setQuestions(qs)
    } catch(e) { showToast('❌ Error generating questions. Try again.'); console.error(e) }
    setLoading(false)
  }

  async function startPractice(topic?: string, testType: TestFocus = 'mixed') {
    setDone(false); setQIdx(0); setSessCorrect(0); setAnswered(false)
    setSelected(null); setResults([]); setShowFollowUp(false); setFollowUp('')
    setPage('practice')
    await genQ({ topic, testType, count: 5 })
  }

  async function startTest(testType: 'mcap' | 'map') {
    setDone(false); setQIdx(0); setTestCorrect(0); setAnswered(false)
    setSelected(null); setResults([]); setShowFollowUp(false); setFollowUp('')
    setPage(testType === 'mcap' ? 'mcap_test' : 'map_test')
    await genQ({ testType, count: 10, difficulty: 'hard' })
    if (qMode === 'timed') { setTimer(30); setTimerOn(true) }
  }

  function recordAnswer(choiceIdx: number, isTest: boolean) {
    if (answered) return
    const q = questions[qIdx]
    const correct = choiceIdx === q.correct
    setAnswered(true); setSelected(choiceIdx); setTimerOn(false)
    setShowFollowUp(false); setFollowUp('')
    setResults(prev => [...prev, { correct, selected: choiceIdx, question: q }])
    if (!isTest && correct) setSessCorrect(c => c + 1)
    if (isTest && correct) setTestCorrect(c => c + 1)
    const topicKey = q.topic as TopicKey
    update(s => {
      const t = { ...s[twin as Twin] }
      const stats = { ...t.stats }
      if (topicKey in stats) {
        stats[topicKey] = { correct: stats[topicKey].correct + (correct ? 1 : 0), total: stats[topicKey].total + 1 }
      }
      t.stats = stats
      t.points = (t.points || 0) + (correct ? (isTest ? 15 : 10) : 0)
      return { ...s, [twin as Twin]: t }
    })
  }

  function doAutoSkip() {
    if (answered) return
    const q = questions[qIdx]
    setAnswered(true); setSelected(-1)
    setResults(prev => [...prev, { correct: false, selected: -1, question: q }])
    const topicKey = q.topic as TopicKey
    update(s => {
      const t = { ...s[twin as Twin] }
      const stats = { ...t.stats }
      if (topicKey in stats) stats[topicKey] = { correct: stats[topicKey].correct, total: stats[topicKey].total + 1 }
      t.stats = stats
      return { ...s, [twin as Twin]: t }
    })
  }

  function goNext(isTest: boolean) {
    setAnswered(false); setSelected(null); setShowFollowUp(false); setFollowUp('')
    if (qIdx + 1 >= questions.length) {
      setDone(true)
      if (!isTest) finishSession()
      else finishTest()
    } else {
      setQIdx(i => i + 1)
      if (isTest && qMode === 'timed') { setTimer(30); setTimerOn(true) }
    }
  }

  function finishSession() {
    const di = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    update(s => {
      const t = { ...s[twin as Twin] }
      const days = [...t.weekDays]; days[di] = 1
      t.weekDays = days; t.streak = (t.streak || 0) + 1
      return { ...s, [twin as Twin]: t }
    })
  }

  function finishTest() {
    update(s => {
      const t = { ...s[twin as Twin] }
      t.quizScores = [...(t.quizScores || []), Math.round(testCorrect / questions.length * 100)]
      t.points = (t.points || 0) + testCorrect * 5
      return { ...s, [twin as Twin]: t }
    })
  }

  async function getFollowUp(q: Question) {
    setLoadingFollowUp(true); setShowFollowUp(true)
    try {
      const r = await fetch('/api/explain', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q.question, choices: q.choices, correct: q.correct, explanation: q.explanation }),
      })
      const { explanation } = await r.json()
      setFollowUp(explanation)
    } catch { setFollowUp('Sorry, could not load extra help. Try again!') }
    setLoadingFollowUp(false)
  }

  const Q = questions[qIdx]

  // ── shared helpers ───────────────────────────────────────────
  const Spinner = () => (
    <div style={{ display:'inline-block', width:48, height:48, border:`4px solid ${S.blue}30`, borderTop:`4px solid ${S.blue}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:16 }} />
  )

  const LoadCard = ({ msg }: { msg: string }) => (
    <div style={{ ...card(), textAlign:'center', padding:64 }}>
      <Spinner /><div style={{ color:'white', fontWeight:700 }}>{msg}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ── REPORT CARD ──────────────────────────────────────────────
  const missed = results.filter(r => !r.correct)
  const byTopic: Record<string, { ok: number; total: number }> = {}
  results.forEach(r => {
    const t = r.question.topic
    if (!byTopic[t]) byTopic[t] = { ok: 0, total: 0 }
    byTopic[t].total++
    if (r.correct) byTopic[t].ok++
  })

  const ReportCard = ({ isTest, testType }: { isTest?: boolean; testType?: string }) => {
    const correct = isTest ? testCorrect : sessCorrect
    const total = questions.length
    const score = total ? Math.round(correct / total * 100) : 0
    const scoreC = score >= 70 ? S.green : score >= 50 ? S.orange : S.pink

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Score banner */}
        <div style={{ ...card(), textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:12 }}>{score >= 80 ? '🏆' : score >= 60 ? '🌟' : '💪'}</div>
          <div style={{ fontSize:32, fontWeight:900, color:'white', marginBottom:8 }}>
            {isTest ? `${testType?.toUpperCase()} Test Done!` : 'Session Complete!'}
          </div>
          <div style={{ fontSize:48, fontWeight:900, color:scoreC, margin:'12px 0' }}>{correct}/{total}</div>
          <div style={{ fontSize:20, fontWeight:700, color:scoreC, marginBottom:8 }}>{score}% correct</div>
          <div style={{ color:S.muted, marginBottom:20 }}>+{correct * (isTest ? 15 : 10)} points earned!</div>
          <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
            <button onClick={() => { setQuestions([]); setDone(false); setResults([]) }}
              style={{ padding:'12px 24px', borderRadius:12, fontWeight:700, background:S.surface2, color:'white', border:`1px solid ${S.border}`, cursor:'pointer', fontSize:15 }}>
              🔄 Try Again
            </button>
            <button onClick={() => setPage('dashboard')}
              style={{ padding:'12px 24px', borderRadius:12, fontWeight:700, background:`linear-gradient(135deg,${color},${color}aa)`, color:'white', border:'none', cursor:'pointer', fontSize:15 }}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Topic breakdown */}
        {Object.keys(byTopic).length > 0 && (
          <div style={card()}>
            <div style={{ fontSize:18, fontWeight:900, color:'white', marginBottom:16 }}>📊 Performance by Topic</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Object.entries(byTopic).map(([t, s]) => {
                const p = Math.round(s.ok / s.total * 100)
                const c = TOPIC_COLORS[t as TopicKey] || S.blue
                const barC = p >= 70 ? S.green : p >= 50 ? S.orange : S.pink
                return (
                  <div key={t} style={{ background:S.surface2, borderRadius:12, padding:14, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:24 }}>{TOPIC_ICONS[t as TopicKey] || '🧮'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'white', marginBottom:6 }}>{TOPIC_LABELS[t as TopicKey] || t}</div>
                      <div style={{ background:S.bg, borderRadius:6, height:8 }}>
                        <div style={{ height:8, borderRadius:6, width:`${p}%`, background:barC }} />
                      </div>
                    </div>
                    <div style={{ fontSize:14, fontWeight:900, color:barC }}>{p}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Missed questions */}
        {missed.length > 0 && (
          <div style={card()}>
            <div style={{ fontSize:18, fontWeight:900, color:'white', marginBottom:4 }}>❌ Review These ({missed.length})</div>
            <div style={{ color:S.muted, fontSize:13, marginBottom:20 }}>Study each one carefully — tap "I still don't get it" for a simpler explanation!</div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {missed.map((r, i) => <MissedCard key={i} result={r} idx={i} color={color} />)}
            </div>
          </div>
        )}

        {missed.length === 0 && (
          <div style={{ ...card(), textAlign:'center', border:`1px solid ${S.green}40`, background:`${S.green}08` }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌟</div>
            <div style={{ fontSize:24, fontWeight:900, color:S.green, marginBottom:8 }}>Perfect Score!</div>
            <div style={{ color:S.muted }}>Every answer correct — amazing work!</div>
          </div>
        )}
      </div>
    )
  }

  // ── QUESTION CARD ────────────────────────────────────────────
  const QuestionCard = ({ isTest, testColor }: { isTest?: boolean; testColor?: string }) => {
    if (!Q) return null
    const tc = TOPIC_COLORS[Q.topic as TopicKey] || S.blue
    const btnColor = testColor || color
    const isCorrect = selected === Q.correct
    const isWrong = answered && !isCorrect
    const timedOut = selected === -1

    return (
      <div style={card()}>
        {/* header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:`${tc}20`, color:tc }}>
              {TOPIC_ICONS[Q.topic as TopicKey]||'🧮'} {Q.subtopic || TOPIC_LABELS[Q.topic as TopicKey] || Q.topic}
            </span>
            {Q.testType && <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:S.surface2, color:S.muted }}>{Q.testType.toUpperCase()}</span>}
            <span style={{ fontSize:13, color:S.muted }}>Q{qIdx+1} of {questions.length}</span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            {questions.map((_,i) => (
              <div key={i} style={{ width:10, height:10, borderRadius:'50%', background: i < qIdx ? S.green : i === qIdx ? btnColor : S.border }} />
            ))}
          </div>
        </div>

        {/* question */}
        <div style={{ fontSize:20, fontWeight:700, color:'white', lineHeight:1.5, marginBottom:24 }}>{Q.question}</div>

        {/* choices */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {Q.choices.map((c, i) => {
            let bg = S.surface2, border = S.border, textC = 'white'
            if (answered) {
              if (i === Q.correct) { bg = `${S.green}18`; border = S.green; textC = S.green }
              else if (i === selected) { bg = `${S.pink}18`; border = S.pink; textC = S.pink }
              else { textC = '#444' }
            }
            const circleStyle: React.CSSProperties = {
              width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:12, fontWeight:900, flexShrink:0,
              background: answered && i === Q.correct ? S.green : answered && i === selected && i !== Q.correct ? S.pink : S.border,
              color: answered && (i === Q.correct || (i === selected && i !== Q.correct)) ? 'white' : S.muted,
            }
            return (
              <button key={i} onClick={() => recordAnswer(i, !!isTest)} disabled={answered}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:12, border:`2px solid ${border}`, background:bg, cursor:answered?'default':'pointer', textAlign:'left', fontFamily:'system-ui', fontSize:15, fontWeight:600, color:textC, transition:'all 0.15s' }}>
                <div style={circleStyle}>{['A','B','C','D'][i]}</div>
                <span style={{ flex:1 }}>{c.substring(3)}</span>
                {answered && i === Q.correct && <span>✅</span>}
                {answered && i === selected && i !== Q.correct && <span>❌</span>}
              </button>
            )
          })}
        </div>

        {/* feedback */}
        {answered && (
          <div style={{ borderRadius:14, padding:20, marginBottom:16, border:`1px solid ${isCorrect ? S.green+'40' : S.pink+'40'}`, background: isCorrect ? `${S.green}10` : '#1e1a2e' }}>
            <div style={{ fontSize:18, fontWeight:900, color: isCorrect ? S.green : S.pink, marginBottom:12 }}>
              {timedOut ? "⏰ Time's up!" : isCorrect ? '✅ Correct! Great job!' : "❌ Not quite — let's learn from this!"}
            </div>

            {/* your answer vs correct */}
            {isWrong && !timedOut && selected !== null && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:`${S.pink}12`, fontSize:14 }}>
                  <span style={{ fontWeight:700, color:S.pink, minWidth:100, flexShrink:0 }}>❌ You chose:</span>
                  <span style={{ color:S.pink }}>{Q.choices[selected]}</span>
                </div>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:`${S.green}12`, fontSize:14 }}>
                  <span style={{ fontWeight:700, color:S.green, minWidth:100, flexShrink:0 }}>✅ Correct:</span>
                  <span style={{ color:S.green }}>{Q.choices[Q.correct]}</span>
                </div>
              </div>
            )}
            {timedOut && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:`${S.green}12`, fontSize:14, marginBottom:16 }}>
                <span style={{ fontWeight:700, color:S.green, minWidth:100, flexShrink:0 }}>✅ Correct:</span>
                <span style={{ color:S.green }}>{Q.choices[Q.correct]}</span>
              </div>
            )}

            {/* step by step */}
            <div style={{ background:S.surface2, borderRadius:12, padding:16, marginBottom: isWrong ? 12 : 0 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#ffd700', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>💡 Step-by-Step Solution</div>
              <div style={{ fontSize:14, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{Q.explanation}</div>
            </div>

            {/* still don't get it */}
            {isWrong && !showFollowUp && (
              <button onClick={() => getFollowUp(Q)}
                style={{ marginTop:12, padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:700, background:`${color}20`, color, border:`1px solid ${color}40`, cursor:'pointer', fontFamily:'system-ui' }}>
                🤔 I still don't get it — explain differently
              </button>
            )}
            {isWrong && showFollowUp && (
              <div style={{ marginTop:12, background:S.surface, border:`1px solid ${S.blue}40`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:S.blue, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>🔍 Another Way to Think About It</div>
                {loadingFollowUp
                  ? <div style={{ color:S.muted, fontSize:14 }}>Getting a simpler explanation...</div>
                  : <div style={{ fontSize:14, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{followUp}</div>
                }
              </div>
            )}
          </div>
        )}

        {/* next button */}
        {answered && (
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => goNext(!!isTest)}
              style={{ padding:'12px 32px', borderRadius:12, fontWeight:900, fontSize:16, color:'white', background:`linear-gradient(135deg,${btnColor},${btnColor}aa)`, border:'none', cursor:'pointer', boxShadow:`0 4px 20px ${btnColor}40`, fontFamily:'system-ui' }}>
              {qIdx === questions.length - 1 ? '🏁 See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── PAGE: DASHBOARD ──────────────────────────────────────────
  if (page === 'dashboard') return (
    <Layout twin={twin} data={data} color={color} page={page} setPage={setPage}
      mcap={mcap} mcapC={mcapC} rit={rit} ritC={ritC}
      onResetPage={(p) => { setQuestions([]); setDone(false); setPage(p) }}>
      <div>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:32, fontWeight:900, color:'white', margin:'0 0 4px' }}>Welcome back, {data.name}! 👋</h1>
          <p style={{ color:S.muted, margin:0 }}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</p>
        </div>

        {/* Score cards */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
          {[
            { label:'Maryland MCAP', icon:'🎯', score:mcap, c:mcapC, goal:230, label2:getMCAPLabel(mcap), tt:'mcap', min:200, range:80 },
            { label:'NWEA MAP RIT', icon:'📈', score:rit, c:ritC, goal:220, label2:getRITLabel(rit), tt:'map', min:200, range:45 },
          ].map(s => (
            <div key={s.tt} style={{ borderRadius:16, padding:20, border:`1px solid ${s.c}30`, background:`${s.c}08` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:s.c, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.icon} {s.label}</div>
                  <div style={{ fontSize:44, fontWeight:900, color:s.c }}>{s.score > 0 ? s.score : '---'}</div>
                  <div style={{ fontSize:13, color:s.c, marginTop:2 }}>{s.label2}</div>
                </div>
                <div style={{ textAlign:'right', fontSize:12, color:S.muted }}>
                  <div>Target: {s.goal}+</div>
                  {s.score > 0 && s.score < s.goal && <div style={{ fontWeight:700, color:'white', marginTop:4 }}>+{s.goal - s.score} needed</div>}
                  {s.score >= s.goal && <div style={{ fontWeight:700, color:S.green, marginTop:4 }}>On track! 🎉</div>}
                </div>
              </div>
              {s.score > 0 && (
                <div style={{ background:'#0f111740', borderRadius:6, height:8, marginBottom:12 }}>
                  <div style={{ height:8, borderRadius:6, width:`${Math.min((s.score-s.min)/s.range*100,100)}%`, background:`linear-gradient(90deg,${S.pink},${s.c})` }} />
                </div>
              )}
              {s.score === 0 && <div style={{ fontSize:12, color:S.muted, marginBottom:12 }}>Practice 5+ questions to see your score</div>}
              <button onClick={() => startTest(s.tt as 'mcap'|'map')}
                style={{ width:'100%', padding:'8px', borderRadius:10, fontWeight:700, fontSize:13, background:`${s.c}20`, color:s.c, border:`1px solid ${s.c}40`, cursor:'pointer', fontFamily:'system-ui' }}>
                Start {s.tt.toUpperCase()} Practice Test →
              </button>
            </div>
          ))}
        </div>

        {/* Week */}
        <div style={{ ...card(), marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:S.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>📅 This Week</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:16 }}>
            {DAYS.map((d,i) => {
              const done2 = data.weekDays[i], isToday = i===todayIdx, isPast = i<todayIdx
              const bg = isToday?`${S.blue}15`:done2&&isPast?`${S.green}15`:'transparent'
              const bc = isToday?S.blue:done2&&isPast?S.green:S.border
              const tc2 = isToday?S.blue:done2&&isPast?S.green:!done2&&isPast?'#444':S.muted
              return (
                <div key={d} style={{ textAlign:'center', padding:'10px 4px', borderRadius:10, background:bg, border:`1px solid ${bc}`, fontSize:11, fontWeight:700, color:tc2 }}>
                  <div style={{ fontSize:16, marginBottom:4 }}>{isToday?'📅':done2&&isPast?'✓':!done2&&isPast?'✗':'○'}</div>{d}
                </div>
              )
            })}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:S.muted, marginBottom:8 }}>
            <span>Questions this week</span><span style={{ fontWeight:700, color:'white' }}>{data.weekDays.filter(Boolean).length*5}/35</span>
          </div>
          <div style={{ background:S.surface2, borderRadius:6, height:8 }}>
            <div style={{ height:8, borderRadius:6, width:`${Math.min(data.weekDays.filter(Boolean).length/7*100,100)}%`, background:`linear-gradient(90deg,${color},${color}aa)` }} />
          </div>
        </div>

        {/* Domain tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {(['mcap','map'] as const).map(tab => (
            <button key={tab} onClick={() => setDashTab(tab)}
              style={{ padding:'8px 20px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'system-ui', background: dashTab===tab?`linear-gradient(135deg,${color},${color}aa)`:'transparent', color: dashTab===tab?'white':S.muted, border: dashTab===tab?'none':`1px solid ${S.border}` }}>
              {tab==='mcap'?'🎯 MCAP Domains':'📈 MAP Domains'}
            </button>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
          {(dashTab==='mcap'?MCAP_TOPICS:MAP_TOPICS).map(topic => {
            const s = data.stats[topic], p = pct(s), c = TOPIC_COLORS[topic]
            return (
              <div key={topic} onClick={() => startPractice(topic, dashTab)}
                style={{ background:S.surface, border:`1px solid ${S.border}`, borderTop:`3px solid ${c}`, borderRadius:14, padding:16, cursor:'pointer', transition:'transform 0.15s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.transform='scale(1.02)'}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.transform='scale(1)'}>
                <div style={{ fontSize:20, marginBottom:6 }}>{TOPIC_ICONS[topic]}</div>
                <div style={{ fontSize:11, fontWeight:700, color:S.muted, marginBottom:8, lineHeight:1.3 }}>{TOPIC_LABELS[topic]}</div>
                <div style={{ fontSize:24, fontWeight:900, color:c }}>{p}%</div>
                <div style={{ fontSize:11, color:S.muted }}>{s.correct}/{s.total}</div>
                <div style={{ marginTop:8, background:S.surface2, borderRadius:4, height:4 }}>
                  <div style={{ height:4, borderRadius:4, width:`${p}%`, background:c }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick start */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[
            { label:'🔀 Mixed Practice', sub:'5q · MCAP + MAP · All topics', onClick:()=>startPractice(undefined,'mixed') },
            { label:'🎯 MCAP Focus', sub:'Maryland state test prep', onClick:()=>startPractice(undefined,'mcap') },
            { label:'📈 MAP Focus', sub:`Adaptive · RIT ${rit||215} level`, onClick:()=>startPractice(undefined,'map') },
          ].map(b => (
            <button key={b.label} onClick={b.onClick}
              style={{ padding:20, background:S.surface, border:`1px solid ${S.border}`, borderRadius:14, textAlign:'left', cursor:'pointer', fontFamily:'system-ui', transition:'border-color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget as HTMLButtonElement).style.borderColor=color}
              onMouseLeave={e=>(e.currentTarget as HTMLButtonElement).style.borderColor=S.border}>
              <div style={{ fontWeight:700, color:'white', marginBottom:4 }}>{b.label}</div>
              <div style={{ fontSize:12, color:S.muted }}>{b.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </Layout>
  )

  // ── PAGE: PRACTICE ───────────────────────────────────────────
  if (page === 'practice') return (
    <Layout twin={twin} data={data} color={color} page={page} setPage={setPage}
      mcap={mcap} mcapC={mcapC} rit={rit} ritC={ritC}
      onResetPage={(p) => { setQuestions([]); setDone(false); setPage(p) }}>
      <div>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 4px' }}>✏️ Daily Practice</h1>
          <p style={{ color:S.muted, margin:0 }}>MCAP + MAP aligned · Negatives & Decimals · Take your time!</p>
        </div>
        {loading && <LoadCard msg="Generating your questions..." />}
        {!loading && questions.length === 0 && !done && (
          <div style={{ ...card(), textAlign:'center', padding:48 }}>
            <div style={{ fontSize:56, marginBottom:16 }}>✏️</div>
            <div style={{ fontSize:24, fontWeight:900, color:'white', marginBottom:20 }}>What do you want to practice?</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:480, margin:'0 auto 24px' }}>
              {[{t:'mixed',l:'🔀 Mixed',s:'MCAP + MAP'},{t:'mcap',l:'🎯 MCAP',s:'Maryland test'},{t:'map',l:'📈 MAP',s:`RIT ${rit||215} level`}].map(o => (
                <button key={o.t} onClick={() => startPractice(undefined, o.t as TestFocus)}
                  style={{ padding:'14px 10px', borderRadius:12, border:`2px solid ${S.border}`, background:S.surface2, cursor:'pointer', fontFamily:'system-ui' }}>
                  <div style={{ fontWeight:700, color:'white', fontSize:14, marginBottom:4 }}>{o.l}</div>
                  <div style={{ fontSize:12, color:S.muted }}>{o.s}</div>
                </button>
              ))}
            </div>
            <div style={{ fontSize:13, color:S.muted, marginBottom:12 }}>Or practice a specific topic:</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
              {[...MCAP_TOPICS,...MAP_TOPICS].map(t => (
                <button key={t} onClick={() => startPractice(t)}
                  style={{ padding:'8px 14px', borderRadius:8, fontSize:12, fontWeight:700, background:`${TOPIC_COLORS[t]}18`, color:TOPIC_COLORS[t], border:`1px solid ${TOPIC_COLORS[t]}40`, cursor:'pointer', fontFamily:'system-ui' }}>
                  {TOPIC_ICONS[t]} {TOPIC_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
        )}
        {!loading && done && <ReportCard />}
        {!loading && Q && !done && <QuestionCard />}
      </div>
    </Layout>
  )

  // ── PAGE: MCAP / MAP TEST ────────────────────────────────────
  const isMap = page === 'map_test'
  const testColor = isMap ? S.orange : S.green
  const testLabel = isMap ? 'MAP' : 'MCAP'

  return (
    <Layout twin={twin} data={data} color={color} page={page} setPage={setPage}
      mcap={mcap} mcapC={mcapC} rit={rit} ritC={ritC}
      onResetPage={(p) => { setQuestions([]); setDone(false); setPage(p) }}>
      <div>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 4px' }}>
            {isMap ? '📈' : '🎯'} {testLabel} Practice Test
          </h1>
          <p style={{ color:S.muted, margin:0 }}>
            {isMap ? `NWEA MAP style · 10 questions · RIT ${rit||215} level · Target: 220+` : 'Maryland state test · 10 questions · All 5 domains · Target: 230+'}
          </p>
        </div>
        {loading && <LoadCard msg={`Building your ${testLabel} practice test...`} />}
        {!loading && questions.length === 0 && !done && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[{id:'timed',icon:'⏱️',title:'Timed Mode',desc:'30 sec per question — simulates test pressure'},{id:'review',icon:'📖',title:'Review Mode',desc:'Take your time, see full explanations after each'}].map(m => (
                <button key={m.id} onClick={() => setQMode(m.id as QuizMode)}
                  style={{ padding:24, borderRadius:16, border:`2px solid ${qMode===m.id?testColor:S.border}`, background:qMode===m.id?`${testColor}12`:S.surface, textAlign:'left', cursor:'pointer', fontFamily:'system-ui', transition:'all 0.2s' }}>
                  <div style={{ fontSize:36, marginBottom:10 }}>{m.icon}</div>
                  <div style={{ fontWeight:900, color:'white', fontSize:18, marginBottom:4 }}>{m.title}</div>
                  <div style={{ fontSize:13, color:S.muted }}>{m.desc}</div>
                </button>
              ))}
            </div>
            <div style={{ ...card(), textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>{isMap?'📈':'🎯'}</div>
              <div style={{ fontSize:22, fontWeight:900, color:'white', marginBottom:6 }}>{testLabel} Practice Test</div>
              <div style={{ color:S.muted, marginBottom:4 }}>10 questions · All domains · Negatives & Decimals included</div>
              <div style={{ fontSize:13, color:testColor, marginBottom:24 }}>
                {isMap ? `Adaptive to your RIT ${rit||215} level` : 'Multi-step MCAP-style problems'}
              </div>
              <button onClick={() => startTest(isMap?'map':'mcap')}
                style={{ padding:'14px 32px', borderRadius:12, fontWeight:700, fontSize:17, color:'white', background:`linear-gradient(135deg,${testColor},${testColor}aa)`, border:'none', cursor:'pointer', fontFamily:'system-ui' }}>
                Start {testLabel} Test →
              </button>
            </div>
          </div>
        )}
        {!loading && done && <ReportCard isTest testType={isMap?'map':'mcap'} />}
        {!loading && Q && !done && (
          <>
            {qMode === 'timed' && (
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:48, fontWeight:900, color: timer<=10?S.pink:S.orange }}>0:{timer.toString().padStart(2,'0')}</div>
                <div style={{ fontSize:13, color:S.muted }}>seconds remaining</div>
              </div>
            )}
            <QuestionCard isTest testColor={testColor} />
          </>
        )}
      </div>
    </Layout>
  )
}

// ── MISSED CARD ──────────────────────────────────────────────
function MissedCard({ result, idx, color }: { result: SessionResult; idx: number; color: string }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const q = result.question
  const tc = TOPIC_COLORS[q.topic as TopicKey] || '#6c63ff'

  async function fetchExtra() {
    setLoading(true); setShow(true)
    try {
      const r = await fetch('/api/explain', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ question:q.question, choices:q.choices, correct:q.correct, explanation:q.explanation }),
      })
      const { explanation } = await r.json()
      setText(explanation)
    } catch { setText('Sorry, could not load. Try again!') }
    setLoading(false)
  }

  return (
    <div style={{ border:`1px solid #ff6b9d30`, background:'#ff6b9d06', borderRadius:14, padding:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:24 }}>❌</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${tc}20`, color:tc }}>
              {TOPIC_ICONS[q.topic as TopicKey]||'🧮'} {q.subtopic || TOPIC_LABELS[q.topic as TopicKey] || q.topic}
            </span>
            {q.testType && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#22263a', color:'#8b93b8' }}>{q.testType.toUpperCase()}</span>}
          </div>
          <div style={{ fontWeight:700, color:'white', fontSize:15 }}>{idx+1}. {q.question}</div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16, paddingLeft:36 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'#ff6b9d12', fontSize:13 }}>
          <span style={{ fontWeight:700, color:'#ff6b9d', minWidth:100, flexShrink:0 }}>❌ You chose:</span>
          <span style={{ color:'#ff6b9d' }}>{result.selected === -1 ? '⏰ Timed out' : q.choices[result.selected]}</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'#43e97b12', fontSize:13 }}>
          <span style={{ fontWeight:700, color:'#43e97b', minWidth:100, flexShrink:0 }}>✅ Correct:</span>
          <span style={{ color:'#43e97b' }}>{q.choices[q.correct]}</span>
        </div>
      </div>

      <div style={{ background:'#22263a', borderRadius:12, padding:16, marginBottom:12, marginLeft:36 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#ffd700', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>💡 Step-by-Step Solution</div>
        <div style={{ fontSize:13, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{q.explanation}</div>
      </div>

      {!show && (
        <div style={{ paddingLeft:36 }}>
          <button onClick={fetchExtra}
            style={{ padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:700, background:`${color}20`, color, border:`1px solid ${color}40`, cursor:'pointer', fontFamily:'system-ui' }}>
            🤔 I still don't get it — explain differently
          </button>
        </div>
      )}
      {show && (
        <div style={{ background:'#1a1d27', border:'1px solid #6c63ff40', borderRadius:12, padding:16, marginLeft:36 }}>
          <div style={{ fontSize:11, fontWeight:700, color:'#6c63ff', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>🔍 Another Way to Think About It</div>
          {loading
            ? <div style={{ color:'#8b93b8', fontSize:13 }}>Getting a simpler explanation...</div>
            : <div style={{ fontSize:13, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{text}</div>
          }
        </div>
      )}
    </div>
  )
}

// ── LAYOUT ───────────────────────────────────────────────────
function Layout({ twin, data, color, page, setPage, mcap, mcapC, rit, ritC, onResetPage, children }: {
  twin: Twin; data: TwinData; color: string; page: string
  setPage: (p: Page) => void; mcap: number; mcapC: string; rit: number; ritC: string
  onResetPage: (p: Page) => void; children: React.ReactNode
}) {
  const S2 = { bg:'#0f1117', surface:'#1a1d27', border:'#2e3350', muted:'#8b93b8' }
  const navItems = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'practice', icon:'✏️', label:'Daily Practice' },
    { id:'mcap_test', icon:'🎯', label:'MCAP Test' },
    { id:'map_test', icon:'📈', label:'MAP Test' },
  ]
  return (
    <div style={{ display:'flex', height:'100vh', background:S2.bg, fontFamily:'system-ui', color:'white' }}>
      <aside style={{ width:224, background:S2.surface, borderRight:`1px solid ${S2.border}`, display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0, overflow:'hidden' }}>
        <div style={{ padding:'0 20px 16px', borderBottom:`1px solid ${S2.border}`, marginBottom:16 }}>
          <div style={{ fontSize:18, fontWeight:900, color }}>🧠 Math Academy</div>
          <div style={{ fontSize:11, color:S2.muted, marginTop:2 }}>MCAP + MAP Prep</div>
        </div>
        <div style={{ margin:'0 10px 16px', padding:'10px 12px', borderRadius:12, background:`${color}18`, border:`1px solid ${color}40` }}>
          <div style={{ fontSize:13, fontWeight:900, color }}>{twin==='tim'?'🧑‍🎓':'👨‍🎓'} {data.name}</div>
          <div style={{ fontSize:11, color:S2.muted, marginTop:2 }}>🔥 {data.streak} streak · ⭐ {data.points} pts</div>
        </div>
        {navItems.map(item => (
          <button key={item.id}
            onClick={() => item.id==='practice'||item.id==='mcap_test'||item.id==='map_test' ? onResetPage(item.id as Page) : setPage(item.id as Page)}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', margin:'1px 10px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'system-ui', border:'none', transition:'all 0.15s', background:page===item.id?`${color}28`:'transparent', color:page===item.id?color:S2.muted }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}
        <div style={{ marginTop:'auto', padding:'0 10px', display:'flex', flexDirection:'column', gap:8 }}>
          <div style={{ background:S2.border, borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:S2.muted }}>🎯 MCAP</span>
              <span style={{ fontSize:11, fontWeight:700, color:mcapC }}>Goal: 230</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:mcapC }}>{mcap>0?mcap:'---'}</div>
            <div style={{ fontSize:11, color:mcapC }}>{getMCAPLabel(mcap)}</div>
            {mcap>0&&<div style={{ marginTop:6, background:'#0f1117', borderRadius:4, height:4 }}><div style={{ height:4, borderRadius:4, width:`${Math.min((mcap-200)/80*100,100)}%`, background:mcapC }} /></div>}
          </div>
          <div style={{ background:S2.border, borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:S2.muted }}>📈 MAP RIT</span>
              <span style={{ fontSize:11, fontWeight:700, color:ritC }}>Goal: 220</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:ritC }}>{rit>0?rit:'---'}</div>
            <div style={{ fontSize:11, color:ritC }}>{getRITLabel(rit)}</div>
            {rit>0&&<div style={{ marginTop:6, background:'#0f1117', borderRadius:4, height:4 }}><div style={{ height:4, borderRadius:4, width:`${Math.min((rit-200)/45*100,100)}%`, background:ritC }} /></div>}
          </div>
          <div style={{ background:'linear-gradient(135deg,#f97316,#eab308)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>🔥</span>
            <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>Streak</div><div style={{ fontSize:18, fontWeight:900 }}>{data.streak} days</div></div>
          </div>
          <Link href="/" style={{ display:'block', textAlign:'center', fontSize:12, color:S2.muted, textDecoration:'none', paddingBottom:4 }}>← Switch student</Link>
        </div>
      </aside>
      <main style={{ flex:1, overflowY:'auto', padding:32 }}>{children}</main>
    </div>
  )
}
