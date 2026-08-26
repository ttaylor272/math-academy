'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Twin, Question, TwinData, TopicKey, TWIN_COLORS, TOPIC_COLORS, TOPIC_LABELS, TOPIC_ICONS, MCAP_TOPICS, MAP_TOPICS } from '@/lib/types'
import { loadState, saveState, AppState, pct, estimateMCAPScore, estimateRITScore, getMCAPLabel, getRITLabel, getWeakTopics } from '@/lib/state'
import { CONCEPT_CARDS } from '@/lib/concepts'

const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
type Page = 'dashboard' | 'practice' | 'mcap_test' | 'map_test' | 'concepts'
type QuizMode = 'timed' | 'review'
type TestFocus = 'mcap' | 'map' | 'mixed'
type Confidence = 'sure' | 'unsure' | 'guessed'

interface SessionResult {
  correct: boolean
  selected: number
  confidence: Confidence
  question: Question
}

const S = {
  bg:'#0f1117', surface:'#1a1d27', surface2:'#22263a',
  border:'#2e3350', text:'#e8eaf6', muted:'#8b93b8',
  green:'#43e97b', orange:'#f7971e', pink:'#ff6b9d', blue:'#6c63ff',
}

const confidenceConfig = {
  sure: { label:'✅ I\'m sure!', color:'#43e97b', bg:'#43e97b15' },
  unsure: { label:'🤔 Not 100% sure', color:'#f7971e', bg:'#f7971e15' },
  guessed: { label:'🎲 I guessed', color:'#ff6b9d', bg:'#ff6b9d15' },
}

export default function TwinDashboard() {
  const [twin, setTwin] = useState<Twin | null>(null)
  const [app, setApp] = useState<AppState | null>(null)
  const [page, setPage] = useState<Page>('dashboard')
  const [questions, setQuestions] = useState<Question[]>([])
  const [qIdx, setQIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [confidence, setConfidence] = useState<Confidence | null>(null)
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
  const [showConceptCard, setShowConceptCard] = useState(false)
  const [selectedConcept, setSelectedConcept] = useState<string | null>(null)
  const [waitingConfidence, setWaitingConfidence] = useState(false)

  useEffect(() => {
    const parts = window.location.pathname.split('/')
    const t = parts[parts.length - 1] as Twin
    setTwin(t === 'tim' || t === 'jason' ? t : null)
    setApp(loadState())
  }, [])

  const update = useCallback((fn: (s: AppState) => AppState) => {
    setApp(prev => { if (!prev) return prev; const n = fn(prev); saveState(n); return n })
  }, [])

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
        <p>Unknown student. Use /dashboard/tim or /dashboard/jason</p>
        <Link href="/" style={{ color:S.blue }}>← Home</Link>
      </div>
    </div>
  )
  if (!twin || !app) return <div style={{ minHeight:'100vh', background:S.bg, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontFamily:'system-ui', fontSize:20 }}>Loading...</div>

  const data: TwinData = app[twin]
  const color = TWIN_COLORS[twin].primary
  const mcap = estimateMCAPScore(data)
  const rit = estimateRITScore(data)
  const mcapC = mcap === 0 ? S.muted : mcap >= 240 ? S.green : mcap >= 228 ? S.orange : S.pink
  const ritC = rit === 0 ? S.muted : rit >= 228 ? S.green : rit >= 218 ? S.orange : S.pink
  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  const Q = questions[qIdx]

  async function genQ(opts: { topic?: string; count?: number; difficulty?: string; testType?: string }) {
    setLoading(true)
    try {
      const r = await fetch('/api/generate-questions', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...opts, ritLevel: rit || 228 }),
      })
      const { questions: qs, error } = await r.json()
      if (error) throw new Error(error)
      setQuestions(qs)
    } catch(e) { showToast('❌ Error generating questions. Try again.'); console.error(e) }
    setLoading(false)
  }

  async function startPractice(topic?: string, testType: TestFocus = 'mixed') {
    setDone(false); setQIdx(0); setSessCorrect(0); setAnswered(false)
    setSelected(null); setConfidence(null); setResults([])
    setShowFollowUp(false); setFollowUp(''); setWaitingConfidence(false)
    setPage('practice')
    await genQ({ topic, testType, count: 5 })
  }

  async function startTest(testType: 'mcap' | 'map') {
    setDone(false); setQIdx(0); setTestCorrect(0); setAnswered(false)
    setSelected(null); setConfidence(null); setResults([])
    setShowFollowUp(false); setFollowUp(''); setWaitingConfidence(false)
    setPage(testType === 'mcap' ? 'mcap_test' : 'map_test')
    await genQ({ testType, count: 10, difficulty: 'hard' })
    if (qMode === 'timed') { setTimer(30); setTimerOn(true) }
  }

  function handleAnswer(choiceIdx: number) {
    if (answered || waitingConfidence) return
    setSelected(choiceIdx)
    setTimerOn(false)
    setWaitingConfidence(true) // wait for confidence rating before revealing
  }

  function submitWithConfidence(conf: Confidence, isTest: boolean) {
    if (selected === null) return
    const q = questions[qIdx]
    const correct = selected === q.correct
    setAnswered(true)
    setConfidence(conf)
    setWaitingConfidence(false)
    setShowFollowUp(false); setFollowUp('')
    setResults(prev => [...prev, { correct, selected, confidence: conf, question: q }])
    if (!isTest && correct) setSessCorrect(c => c + 1)
    if (isTest && correct) setTestCorrect(c => c + 1)
    const topicKey = q.topic as TopicKey
    update(s => {
      const t = { ...s[twin as Twin] }
      const stats = { ...t.stats }
      if (topicKey in stats) {
        stats[topicKey] = { correct: stats[topicKey].correct + (correct?1:0), total: stats[topicKey].total + 1 }
      }
      t.stats = stats
      t.points = (t.points||0) + (correct ? (isTest?15:10) : 0)
      return { ...s, [twin as Twin]: t }
    })
  }

  function doAutoSkip() {
    if (answered) return
    const q = questions[qIdx]
    setAnswered(true); setSelected(-1); setWaitingConfidence(false)
    setResults(prev => [...prev, { correct: false, selected: -1, confidence: 'guessed', question: q }])
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
    setAnswered(false); setSelected(null); setConfidence(null)
    setShowFollowUp(false); setFollowUp(''); setWaitingConfidence(false)
    if (qIdx + 1 >= questions.length) {
      setDone(true)
      if (!isTest) finishSession()
      else finishTest()
    } else {
      setQIdx(i => i+1)
      if (isTest && qMode === 'timed') { setTimer(30); setTimerOn(true) }
    }
  }

  function finishSession() {
    const di = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    update(s => {
      const t = { ...s[twin as Twin] }
      const days = [...t.weekDays]; days[di] = 1
      t.weekDays = days; t.streak = (t.streak||0) + 1
      return { ...s, [twin as Twin]: t }
    })
  }

  function finishTest() {
    update(s => {
      const t = { ...s[twin as Twin] }
      t.quizScores = [...(t.quizScores||[]), Math.round(testCorrect/questions.length*100)]
      t.points = (t.points||0) + testCorrect * 5
      return { ...s, [twin as Twin]: t }
    })
  }

  async function getFollowUp(q: Question) {
    setLoadingFollowUp(true); setShowFollowUp(true)
    try {
      const r = await fetch('/api/explain', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ question:q.question, choices:q.choices, correct:q.correct, explanation:q.explanation }),
      })
      const { explanation } = await r.json()
      setFollowUp(explanation)
    } catch { setFollowUp('Sorry, could not load. Try again!') }
    setLoadingFollowUp(false)
  }

  // ── Spinner ─────────────────────────────────────────────────
  const Spinner = () => (
    <>
      <div style={{ display:'inline-block', width:48, height:48, border:`4px solid ${S.blue}30`, borderTop:`4px solid ${S.blue}`, borderRadius:'50%', animation:'spin 0.8s linear infinite', marginBottom:16 }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  )

  // ── Concept Card Modal ────────────────────────────────────────
  const ConceptModal = () => {
    const concept = selectedConcept && CONCEPT_CARDS[selectedConcept]
    if (!concept) return null
    return (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
        onClick={() => setShowConceptCard(false)}>
        <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:20, padding:28, maxWidth:540, width:'100%', maxHeight:'80vh', overflowY:'auto' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
            <div style={{ fontSize:22, fontWeight:900, color:'white' }}>{concept.emoji} {concept.title}</div>
            <button onClick={() => setShowConceptCard(false)} style={{ background:'none', border:'none', color:S.muted, fontSize:24, cursor:'pointer' }}>✕</button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {concept.steps.map((step, i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 14px', background:S.surface2, borderRadius:10 }}>
                <div style={{ width:24, height:24, borderRadius:'50%', background:color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'white', flexShrink:0 }}>{i+1}</div>
                <div style={{ fontSize:14, color:S.text, lineHeight:1.6 }}>{step}</div>
              </div>
            ))}
          </div>
          <div style={{ background:`${S.blue}15`, border:`1px solid ${S.blue}30`, borderRadius:10, padding:14, marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:S.blue, textTransform:'uppercase', marginBottom:6 }}>📝 Example</div>
            <div style={{ fontSize:13, color:S.text, fontFamily:'monospace', lineHeight:1.6 }}>{concept.example}</div>
          </div>
          <div style={{ background:`${S.orange}15`, border:`1px solid ${S.orange}30`, borderRadius:10, padding:14 }}>
            <div style={{ fontSize:13, color:S.orange, lineHeight:1.6 }}>{concept.tip}</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Report Card ───────────────────────────────────────────────
  const ReportCard = ({ isTest, testType }: { isTest?: boolean; testType?: string }) => {
    const correct = isTest ? testCorrect : sessCorrect
    const total = questions.length
    const score = total ? Math.round(correct/total*100) : 0
    const scoreC = score>=80?S.green:score>=60?S.orange:S.pink
    const missed = results.filter(r => !r.correct)
    const guessedRight = results.filter(r => r.correct && r.confidence === 'guessed')
    const unsureRight = results.filter(r => r.correct && r.confidence === 'unsure')

    const byTopic: Record<string, {ok:number;total:number}> = {}
    results.forEach(r => {
      const t = r.question.topic
      if (!byTopic[t]) byTopic[t] = {ok:0,total:0}
      byTopic[t].total++
      if (r.correct) byTopic[t].ok++
    })

    return (
      <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
        {/* Score */}
        <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:32, textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:12 }}>{score>=80?'🏆':score>=60?'🌟':'💪'}</div>
          <div style={{ fontSize:32, fontWeight:900, color:'white', marginBottom:8 }}>
            {isTest ? `${testType?.toUpperCase()} Test Complete!` : 'Session Complete!'}
          </div>
          <div style={{ fontSize:52, fontWeight:900, color:scoreC, margin:'12px 0' }}>{correct}/{total}</div>
          <div style={{ fontSize:20, fontWeight:700, color:scoreC, marginBottom:16 }}>{score}% correct</div>

          {/* Self-evaluation insights */}
          {guessedRight.length > 0 && (
            <div style={{ background:'#f7971e15', border:'1px solid #f7971e30', borderRadius:10, padding:12, marginBottom:10, fontSize:13, color:S.orange }}>
              🎲 You guessed correctly on {guessedRight.length} question{guessedRight.length>1?'s':''} — make sure you understand WHY those are right!
            </div>
          )}
          {unsureRight.length > 0 && (
            <div style={{ background:`${S.blue}15`, border:`1px solid ${S.blue}30`, borderRadius:10, padding:12, marginBottom:10, fontSize:13, color:S.blue }}>
              🤔 You were unsure but got {unsureRight.length} right — review the concept cards to build confidence!
            </div>
          )}

          <div style={{ display:'flex', gap:12, justifyContent:'center', marginTop:16 }}>
            <button onClick={() => { setQuestions([]); setDone(false); setResults([]) }}
              style={{ padding:'12px 24px', borderRadius:12, fontWeight:700, background:S.surface2, color:'white', border:`1px solid ${S.border}`, cursor:'pointer', fontSize:15, fontFamily:'system-ui' }}>
              🔄 Try Again
            </button>
            <button onClick={() => setPage('dashboard')}
              style={{ padding:'12px 24px', borderRadius:12, fontWeight:700, background:`linear-gradient(135deg,${color},${color}aa)`, color:'white', border:'none', cursor:'pointer', fontSize:15, fontFamily:'system-ui' }}>
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Topic breakdown */}
        {Object.keys(byTopic).length > 0 && (
          <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:18, fontWeight:900, color:'white', marginBottom:16 }}>📊 Performance by Topic</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {Object.entries(byTopic).map(([t, s]) => {
                const p = Math.round(s.ok/s.total*100)
                const c = TOPIC_COLORS[t as TopicKey] || S.blue
                const barC = p>=70?S.green:p>=50?S.orange:S.pink
                return (
                  <div key={t} style={{ background:S.surface2, borderRadius:12, padding:14, display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:24 }}>{TOPIC_ICONS[t as TopicKey]||'🧮'}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'white', marginBottom:6 }}>{TOPIC_LABELS[t as TopicKey]||t}</div>
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

        {/* Missed questions review */}
        {missed.length > 0 && (
          <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:24 }}>
            <div style={{ fontSize:18, fontWeight:900, color:'white', marginBottom:4 }}>❌ Questions to Review ({missed.length})</div>
            <div style={{ color:S.muted, fontSize:13, marginBottom:20 }}>For each one: read the solution, use "I still don't get it" if needed, then check the concept card.</div>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {missed.map((r, i) => <MissedCard key={i} result={r} idx={i} color={color} onShowConcept={(topic) => { setSelectedConcept(topic); setShowConceptCard(true) }} />)}
            </div>
          </div>
        )}

        {missed.length === 0 && (
          <div style={{ background:S.surface, border:`1px solid ${S.green}40`, borderRadius:16, padding:32, textAlign:'center' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🌟</div>
            <div style={{ fontSize:24, fontWeight:900, color:S.green, marginBottom:8 }}>Perfect Score!</div>
            <div style={{ color:S.muted }}>Every answer correct — you're crushing advanced math!</div>
          </div>
        )}
      </div>
    )
  }

  // ── Question Card ─────────────────────────────────────────────
  const QuestionCard = ({ isTest, testColor }: { isTest?: boolean; testColor?: string }) => {
    if (!Q) return null
    const tc = TOPIC_COLORS[Q.topic as TopicKey] || S.blue
    const btnColor = testColor || color
    const isCorrect = selected === Q.correct
    const isWrong = answered && !isCorrect
    const timedOut = selected === -1

    return (
      <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:32 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:`${tc}20`, color:tc }}>
              {TOPIC_ICONS[Q.topic as TopicKey]||'🧮'} {Q.subtopic || TOPIC_LABELS[Q.topic as TopicKey] || Q.topic}
            </span>
            {Q.testType && <span style={{ padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:S.surface2, color:S.muted }}>{Q.testType.toUpperCase()}</span>}
            <span style={{ fontSize:13, color:S.muted }}>Q{qIdx+1} of {questions.length}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Concept card button */}
            <button
              onClick={() => { setSelectedConcept(Q.topic); setShowConceptCard(true) }}
              style={{ padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, background:`${color}20`, color, border:`1px solid ${color}40`, cursor:'pointer', fontFamily:'system-ui' }}>
              📚 Concept Card
            </button>
            <div style={{ display:'flex', gap:6 }}>
              {questions.map((_,i) => (
                <div key={i} style={{ width:10, height:10, borderRadius:'50%', background:i<qIdx?S.green:i===qIdx?btnColor:S.border }} />
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div style={{ fontSize:20, fontWeight:700, color:'white', lineHeight:1.5, marginBottom:24 }}>{Q.question}</div>

        {/* Choices */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          {Q.choices.map((c, i) => {
            let bg = S.surface2, border = S.border, textC = 'white'
            if (waitingConfidence && i === selected) { bg = `${S.blue}20`; border = S.blue } // selected but waiting for confidence
            if (answered) {
              if (i === Q.correct) { bg=`${S.green}18`; border=S.green; textC=S.green }
              else if (i === selected) { bg=`${S.pink}18`; border=S.pink; textC=S.pink }
              else { textC='#444' }
            }
            const circleStyle: React.CSSProperties = {
              width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:12, fontWeight:900, flexShrink:0,
              background: answered&&i===Q.correct?S.green : answered&&i===selected&&i!==Q.correct?S.pink : waitingConfidence&&i===selected?S.blue : S.border,
              color: (answered&&(i===Q.correct||(i===selected&&i!==Q.correct))) || (waitingConfidence&&i===selected) ? 'white' : S.muted,
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={answered || waitingConfidence}
                style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderRadius:12, border:`2px solid ${border}`, background:bg, cursor:(answered||waitingConfidence)?'default':'pointer', textAlign:'left', fontFamily:'system-ui', fontSize:15, fontWeight:600, color:textC, transition:'all 0.15s' }}>
                <div style={circleStyle}>{['A','B','C','D'][i]}</div>
                <span style={{ flex:1 }}>{c.substring(3)}</span>
                {answered && i===Q.correct && <span>✅</span>}
                {answered && i===selected && i!==Q.correct && <span>❌</span>}
              </button>
            )
          })}
        </div>

        {/* CONFIDENCE RATING — shows after selecting, before revealing answer */}
        {waitingConfidence && !answered && (
          <div style={{ background:`${S.blue}10`, border:`1px solid ${S.blue}30`, borderRadius:14, padding:20, marginBottom:16 }}>
            <div style={{ fontSize:15, fontWeight:700, color:'white', marginBottom:4 }}>How confident are you in your answer?</div>
            <div style={{ fontSize:13, color:S.muted, marginBottom:14 }}>Be honest — this helps you learn better!</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {(Object.entries(confidenceConfig) as [Confidence, typeof confidenceConfig[Confidence]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => submitWithConfidence(key, !!isTest)}
                  style={{ padding:'12px 8px', borderRadius:12, border:`2px solid ${cfg.color}50`, background:cfg.bg, cursor:'pointer', fontFamily:'system-ui', fontWeight:700, fontSize:13, color:cfg.color, transition:'all 0.15s' }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {answered && (
          <div style={{ borderRadius:14, padding:20, marginBottom:16, border:`1px solid ${isCorrect?S.green+'40':S.pink+'40'}`, background:isCorrect?`${S.green}10`:'#1e1a2e' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ fontSize:18, fontWeight:900, color:isCorrect?S.green:S.pink }}>
                {timedOut?"⏰ Time's up!":isCorrect?'✅ Correct!':'❌ Not quite — let\'s learn from this!'}
              </div>
              {confidence && (
                <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:confidenceConfig[confidence].bg, color:confidenceConfig[confidence].color }}>
                  {confidenceConfig[confidence].label}
                </span>
              )}
            </div>

            {/* Self-eval insight */}
            {isCorrect && confidence === 'guessed' && (
              <div style={{ background:'#f7971e15', border:'1px solid #f7971e30', borderRadius:10, padding:12, marginBottom:12, fontSize:13, color:S.orange }}>
                🎲 You got it right, but you guessed! Read the solution below so you understand WHY — next time it might be harder.
              </div>
            )}
            {isCorrect && confidence === 'unsure' && (
              <div style={{ background:`${S.blue}15`, border:`1px solid ${S.blue}30`, borderRadius:10, padding:12, marginBottom:12, fontSize:13, color:S.blue }}>
                🤔 Good instinct! Check the concept card for this topic to build your confidence.
              </div>
            )}
            {isWrong && confidence === 'sure' && (
              <div style={{ background:`${S.pink}15`, border:`1px solid ${S.pink}30`, borderRadius:10, padding:12, marginBottom:12, fontSize:13, color:S.pink }}>
                ⚠️ You were confident but got it wrong — this is the most important one to review carefully!
              </div>
            )}

            {/* Wrong answer comparison */}
            {isWrong && !timedOut && selected !== null && (
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
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
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:`${S.green}12`, fontSize:14, marginBottom:14 }}>
                <span style={{ fontWeight:700, color:S.green, minWidth:100, flexShrink:0 }}>✅ Correct:</span>
                <span style={{ color:S.green }}>{Q.choices[Q.correct]}</span>
              </div>
            )}

            {/* Step-by-step solution */}
            <div style={{ background:S.surface2, borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#ffd700', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>💡 Step-by-Step Solution</div>
              <div style={{ fontSize:14, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{Q.explanation}</div>
            </div>

            {/* Action buttons */}
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {isWrong && !showFollowUp && (
                <button onClick={() => getFollowUp(Q)}
                  style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700, background:`${color}20`, color, border:`1px solid ${color}40`, cursor:'pointer', fontFamily:'system-ui' }}>
                  🤔 I still don't get it
                </button>
              )}
              <button onClick={() => { setSelectedConcept(Q.topic); setShowConceptCard(true) }}
                style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700, background:`${S.orange}15`, color:S.orange, border:`1px solid ${S.orange}30`, cursor:'pointer', fontFamily:'system-ui' }}>
                📚 Review Concept Card
              </button>
            </div>

            {/* Follow-up explanation */}
            {showFollowUp && (
              <div style={{ marginTop:12, background:S.surface, border:`1px solid ${S.blue}40`, borderRadius:12, padding:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:S.blue, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>🔍 Another Way to Think About It</div>
                {loadingFollowUp
                  ? <div style={{ color:S.muted, fontSize:13 }}>Getting a simpler explanation...</div>
                  : <div style={{ fontSize:14, color:'#c8cadf', lineHeight:1.7, whiteSpace:'pre-line' }}>{followUp}</div>
                }
              </div>
            )}
          </div>
        )}

        {/* Next button */}
        {answered && (
          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <button onClick={() => goNext(!!isTest)}
              style={{ padding:'12px 32px', borderRadius:12, fontWeight:900, fontSize:16, color:'white', background:`linear-gradient(135deg,${btnColor},${btnColor}aa)`, border:'none', cursor:'pointer', boxShadow:`0 4px 20px ${btnColor}40`, fontFamily:'system-ui' }}>
              {qIdx===questions.length-1?'🏁 See Results':'Next Question →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── CONCEPTS PAGE ─────────────────────────────────────────────
  const ConceptsPage = () => (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 4px' }}>📚 Concept Reference Cards</h1>
        <p style={{ color:S.muted, margin:0 }}>Quick review guides for every advanced math topic</p>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        {Object.entries(CONCEPT_CARDS).map(([key, card]) => {
          const tc = TOPIC_COLORS[key as TopicKey] || S.blue
          return (
            <div key={key} onClick={() => { setSelectedConcept(key); setShowConceptCard(true) }}
              style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:14, padding:20, cursor:'pointer', transition:'all 0.15s', borderTop:`3px solid ${tc}` }}
              onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.borderColor=tc}
              onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.borderColor=S.border}>
              <div style={{ fontSize:28, marginBottom:10 }}>{card.emoji}</div>
              <div style={{ fontSize:16, fontWeight:800, color:'white', marginBottom:6 }}>{card.title}</div>
              <div style={{ fontSize:12, color:S.muted, marginBottom:10 }}>{card.steps.length} key steps · Example included</div>
              <div style={{ fontSize:12, color:tc, background:`${tc}15`, padding:'4px 10px', borderRadius:20, display:'inline-block' }}>Tap to review →</div>
            </div>
          )
        })}
      </div>
    </div>
  )

  // ── Shared loading card ────────────────────────────────────────
  const LoadCard = ({ msg }: { msg: string }) => (
    <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:64, textAlign:'center' }}>
      <Spinner /><div style={{ color:'white', fontWeight:700 }}>{msg}</div>
    </div>
  )

  // ── MAIN RENDER ───────────────────────────────────────────────
  return (
    <div style={{ display:'flex', height:'100vh', background:S.bg, fontFamily:'system-ui', color:'white' }}>
      {showConceptCard && <ConceptModal />}

      {/* Sidebar */}
      <aside style={{ width:232, background:S.surface, borderRight:`1px solid ${S.border}`, display:'flex', flexDirection:'column', padding:'20px 0', flexShrink:0 }}>
        <div style={{ padding:'0 20px 16px', borderBottom:`1px solid ${S.border}`, marginBottom:16 }}>
          <div style={{ fontSize:17, fontWeight:900, color }}>🧠 Math Academy</div>
          <div style={{ fontSize:10, color:S.muted, marginTop:2 }}>⚡ Advanced 6th Grade · 7th Grade Standards</div>
        </div>
        <div style={{ margin:'0 10px 16px', padding:'10px 12px', borderRadius:12, background:`${color}18`, border:`1px solid ${color}40` }}>
          <div style={{ fontSize:13, fontWeight:900, color }}>{twin==='tim'?'🧑‍🎓':'👨‍🎓'} {data.name}</div>
          <div style={{ fontSize:11, color:S.muted, marginTop:2 }}>🔥 {data.streak} streak · ⭐ {data.points} pts</div>
        </div>

        {[
          { id:'dashboard', icon:'📊', label:'Dashboard' },
          { id:'practice', icon:'✏️', label:'Daily Practice' },
          { id:'concepts', icon:'📚', label:'Concept Cards' },
          { id:'mcap_test', icon:'🎯', label:'MCAP Test' },
          { id:'map_test', icon:'📈', label:'MAP Test' },
        ].map(item => (
          <button key={item.id}
            onClick={() => {
              if (['practice','mcap_test','map_test'].includes(item.id)) { setQuestions([]); setDone(false) }
              setPage(item.id as Page)
            }}
            style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', margin:'1px 10px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'system-ui', border:'none', background:page===item.id?`${color}28`:'transparent', color:page===item.id?color:S.muted }}>
            <span>{item.icon}</span>{item.label}
          </button>
        ))}

        <div style={{ marginTop:'auto', padding:'0 10px', display:'flex', flexDirection:'column', gap:8 }}>
          {/* MCAP score */}
          <div style={{ background:S.border, borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:S.muted }}>🎯 MCAP</span>
              <span style={{ fontSize:11, fontWeight:700, color:mcapC }}>Goal: 240</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:mcapC }}>{mcap>0?mcap:'---'}</div>
            <div style={{ fontSize:11, color:mcapC }}>{getMCAPLabel(mcap)}</div>
            {mcap>0&&<div style={{ marginTop:6, background:'#0f1117', borderRadius:4, height:4 }}><div style={{ height:4, borderRadius:4, width:`${Math.min((mcap-210)/80*100,100)}%`, background:mcapC }} /></div>}
          </div>
          {/* MAP RIT score */}
          <div style={{ background:S.border, borderRadius:12, padding:'10px 12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span style={{ fontSize:11, fontWeight:700, color:S.muted }}>📈 MAP RIT</span>
              <span style={{ fontSize:11, fontWeight:700, color:ritC }}>Goal: 228</span>
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:ritC }}>{rit>0?rit:'---'}</div>
            <div style={{ fontSize:11, color:ritC }}>{getRITLabel(rit)}</div>
            {rit>0&&<div style={{ marginTop:6, background:'#0f1117', borderRadius:4, height:4 }}><div style={{ height:4, borderRadius:4, width:`${Math.min((rit-210)/45*100,100)}%`, background:ritC }} /></div>}
          </div>
          <div style={{ background:'linear-gradient(135deg,#f97316,#eab308)', borderRadius:12, padding:'10px 12px', display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:20 }}>🔥</span>
            <div><div style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>Streak</div><div style={{ fontSize:18, fontWeight:900 }}>{data.streak} days</div></div>
          </div>
          <Link href="/" style={{ display:'block', textAlign:'center', fontSize:12, color:S.muted, textDecoration:'none', paddingBottom:4 }}>← Switch student</Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, overflowY:'auto', padding:32 }}>

        {/* DASHBOARD */}
        {page === 'dashboard' && (
          <div>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:32, fontWeight:900, color:'white', margin:'0 0 4px' }}>Welcome back, {data.name}! 👋</h1>
              <p style={{ color:S.muted, margin:0 }}>{new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} · Advanced 6th Grade Math</p>
            </div>

            {/* Score cards */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:24 }}>
              {[
                { label:'Maryland MCAP', icon:'🎯', score:mcap, c:mcapC, goal:240, label2:getMCAPLabel(mcap), tt:'mcap', min:210, range:80 },
                { label:'NWEA MAP RIT', icon:'📈', score:rit, c:ritC, goal:228, label2:getRITLabel(rit), tt:'map', min:210, range:45 },
              ].map(s => (
                <div key={s.tt} style={{ borderRadius:16, padding:20, border:`1px solid ${s.c}30`, background:`${s.c}08` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:11, fontWeight:700, color:s.c, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.icon} {s.label}</div>
                      <div style={{ fontSize:44, fontWeight:900, color:s.c }}>{s.score>0?s.score:'---'}</div>
                      <div style={{ fontSize:13, color:s.c, marginTop:2 }}>{s.label2}</div>
                    </div>
                    <div style={{ textAlign:'right', fontSize:12, color:S.muted }}>
                      <div>Target: {s.goal}+</div>
                      {s.score>0&&s.score<s.goal&&<div style={{ fontWeight:700, color:'white', marginTop:4 }}>+{s.goal-s.score} needed</div>}
                      {s.score>=s.goal&&<div style={{ fontWeight:700, color:S.green, marginTop:4 }}>On track! 🎉</div>}
                    </div>
                  </div>
                  {s.score>0&&(
                    <div style={{ background:'#0f111740', borderRadius:6, height:8, marginBottom:12 }}>
                      <div style={{ height:8, borderRadius:6, width:`${Math.min((s.score-s.min)/s.range*100,100)}%`, background:`linear-gradient(90deg,${S.pink},${s.c})` }} />
                    </div>
                  )}
                  {s.score===0&&<div style={{ fontSize:12, color:S.muted, marginBottom:12 }}>Practice 5+ questions to see your score</div>}
                  <button onClick={() => startTest(s.tt as 'mcap'|'map')}
                    style={{ width:'100%', padding:'8px', borderRadius:10, fontWeight:700, fontSize:13, background:`${s.c}20`, color:s.c, border:`1px solid ${s.c}40`, cursor:'pointer', fontFamily:'system-ui' }}>
                    Start {s.tt.toUpperCase()} Practice Test →
                  </button>
                </div>
              ))}
            </div>

            {/* Week */}
            <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:24, marginBottom:24 }}>
              <div style={{ fontSize:12, fontWeight:700, color:S.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:16 }}>📅 This Week</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8, marginBottom:16 }}>
                {DAYS.map((d,i) => {
                  const done2=data.weekDays[i], isToday=i===todayIdx, isPast=i<todayIdx
                  return (
                    <div key={d} style={{ textAlign:'center', padding:'10px 4px', borderRadius:10, fontSize:11, fontWeight:700, border:`1px solid ${isToday?S.blue:done2&&isPast?S.green:S.border}`, background:isToday?`${S.blue}15`:done2&&isPast?`${S.green}15`:'transparent', color:isToday?S.blue:done2&&isPast?S.green:!done2&&isPast?'#444':S.muted }}>
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
                  style={{ padding:'8px 20px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'system-ui', background:dashTab===tab?`linear-gradient(135deg,${color},${color}aa)`:'transparent', color:dashTab===tab?'white':S.muted, border:dashTab===tab?'none':`1px solid ${S.border}` }}>
                  {tab==='mcap'?'🎯 MCAP Domains':'📈 MAP Domains'}
                </button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:24 }}>
              {(dashTab==='mcap'?MCAP_TOPICS:MAP_TOPICS).map(topic => {
                const s=data.stats[topic], p=pct(s), c=TOPIC_COLORS[topic]
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
                { label:'🔀 Mixed Practice', sub:'5q · All advanced topics', onClick:()=>startPractice(undefined,'mixed') },
                { label:'📚 Concept Cards', sub:'Review formulas & methods', onClick:()=>setPage('concepts') },
                { label:'📈 MAP Focus', sub:`Adaptive · RIT ${rit||228} level`, onClick:()=>startPractice(undefined,'map') },
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
        )}

        {/* PRACTICE */}
        {page === 'practice' && (
          <div>
            <div style={{ marginBottom:24 }}>
              <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 4px' }}>✏️ Daily Practice</h1>
              <p style={{ color:S.muted, margin:0 }}>Advanced 7th grade topics · Rate your confidence · Take your time!</p>
            </div>
            {loading && <LoadCard msg="Generating advanced questions..." />}
            {!loading && questions.length===0 && !done && (
              <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:48, textAlign:'center' }}>
                <div style={{ fontSize:56, marginBottom:16 }}>✏️</div>
                <div style={{ fontSize:24, fontWeight:900, color:'white', marginBottom:20 }}>What do you want to practice?</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, maxWidth:480, margin:'0 auto 24px' }}>
                  {[{t:'mixed',l:'🔀 Mixed',s:'All topics'},{t:'mcap',l:'🎯 MCAP',s:'MD state test'},{t:'map',l:'📈 MAP',s:`RIT ${rit||228}`}].map(o => (
                    <button key={o.t} onClick={() => startPractice(undefined, o.t as TestFocus)}
                      style={{ padding:'14px 10px', borderRadius:12, border:`2px solid ${S.border}`, background:S.surface2, cursor:'pointer', fontFamily:'system-ui' }}>
                      <div style={{ fontWeight:700, color:'white', fontSize:14, marginBottom:4 }}>{o.l}</div>
                      <div style={{ fontSize:12, color:S.muted }}>{o.s}</div>
                    </button>
                  ))}
                </div>
                <div style={{ fontSize:13, color:S.muted, marginBottom:12 }}>Or drill a specific topic:</div>
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
        )}

        {/* CONCEPTS */}
        {page === 'concepts' && <ConceptsPage />}

        {/* MCAP / MAP TEST */}
        {(page==='mcap_test'||page==='map_test') && (() => {
          const isMap = page==='map_test'
          const testColor = isMap?S.orange:S.green
          const testLabel = isMap?'MAP':'MCAP'
          return (
            <div>
              <div style={{ marginBottom:24 }}>
                <h1 style={{ fontSize:30, fontWeight:900, color:'white', margin:'0 0 4px' }}>{isMap?'📈':'🎯'} {testLabel} Practice Test</h1>
                <p style={{ color:S.muted, margin:0 }}>{isMap?`NWEA MAP · 10 questions · RIT ${rit||228} level · Target: 228+`:'Maryland MCAP · 10 questions · 7th grade level · Target: 240+'}</p>
              </div>
              {loading && <LoadCard msg={`Building ${testLabel} practice test...`} />}
              {!loading && questions.length===0 && !done && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    {[{id:'timed',icon:'⏱️',title:'Timed Mode',desc:'30 sec per question — test pressure'},{id:'review',icon:'📖',title:'Review Mode',desc:'Take your time, full explanations'}].map(m => (
                      <button key={m.id} onClick={() => setQMode(m.id as QuizMode)}
                        style={{ padding:24, borderRadius:16, border:`2px solid ${qMode===m.id?testColor:S.border}`, background:qMode===m.id?`${testColor}12`:S.surface, textAlign:'left', cursor:'pointer', fontFamily:'system-ui' }}>
                        <div style={{ fontSize:36, marginBottom:10 }}>{m.icon}</div>
                        <div style={{ fontWeight:900, color:'white', fontSize:18, marginBottom:4 }}>{m.title}</div>
                        <div style={{ fontSize:13, color:S.muted }}>{m.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ background:S.surface, border:`1px solid ${S.border}`, borderRadius:16, padding:48, textAlign:'center' }}>
                    <div style={{ fontSize:48, marginBottom:12 }}>{isMap?'📈':'🎯'}</div>
                    <div style={{ fontSize:22, fontWeight:900, color:'white', marginBottom:6 }}>{testLabel} Practice Test</div>
                    <div style={{ color:S.muted, marginBottom:4 }}>10 questions · 7th grade advanced · Rate your confidence!</div>
                    <div style={{ fontSize:13, color:testColor, marginBottom:24 }}>{isMap?`Adaptive to RIT ${rit||228}`:'Multi-step 7th grade problems'}</div>
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
                  {qMode==='timed' && (
                    <div style={{ textAlign:'center', marginBottom:16 }}>
                      <div style={{ fontSize:48, fontWeight:900, color:timer<=10?S.pink:S.orange }}>0:{timer.toString().padStart(2,'0')}</div>
                      <div style={{ fontSize:13, color:S.muted }}>seconds remaining</div>
                    </div>
                  )}
                  <QuestionCard isTest testColor={testColor} />
                </>
              )}
            </div>
          )
        })()}

      </main>

      {toast && <div style={{ position:'fixed', bottom:24, right:24, background:S.surface, border:`1px solid ${S.border}`, borderRadius:12, padding:'12px 20px', fontWeight:700, fontSize:14, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', zIndex:100 }}>{toast}</div>}
    </div>
  )
}

// ── MISSED CARD ───────────────────────────────────────────────
function MissedCard({ result, idx, color, onShowConcept }: { result: SessionResult; idx: number; color: string; onShowConcept: (topic: string) => void }) {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const q = result.question
  const tc = TOPIC_COLORS[q.topic as TopicKey] || '#6c63ff'
  const conf = result.confidence

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
    <div style={{ border:'1px solid #ff6b9d30', background:'#ff6b9d06', borderRadius:14, padding:20 }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:16 }}>
        <div style={{ fontSize:24, flexShrink:0 }}>❌</div>
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8, flexWrap:'wrap' }}>
            <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:`${tc}20`, color:tc }}>
              {TOPIC_ICONS[q.topic as TopicKey]||'🧮'} {q.subtopic || TOPIC_LABELS[q.topic as TopicKey] || q.topic}
            </span>
            {conf && <span style={{ padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background:'#22263a', color: conf==='sure'?'#ff6b9d':conf==='unsure'?'#f7971e':'#8b93b8' }}>
              {conf==='sure'?'Was confident ⚠️':conf==='unsure'?'Was unsure':'Guessed'}
            </span>}
          </div>
          <div style={{ fontWeight:700, color:'white', fontSize:15 }}>{idx+1}. {q.question}</div>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:14, paddingLeft:36 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:10, background:'#ff6b9d12', fontSize:13 }}>
          <span style={{ fontWeight:700, color:'#ff6b9d', minWidth:100, flexShrink:0 }}>❌ You chose:</span>
          <span style={{ color:'#ff6b9d' }}>{result.selected===-1?'⏰ Timed out':q.choices[result.selected]}</span>
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

      <div style={{ display:'flex', gap:10, paddingLeft:36, flexWrap:'wrap' }}>
        {!show && (
          <button onClick={fetchExtra}
            style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700, background:`${color}20`, color, border:`1px solid ${color}40`, cursor:'pointer', fontFamily:'system-ui' }}>
            🤔 I still don't get it
          </button>
        )}
        <button onClick={() => onShowConcept(q.topic)}
          style={{ padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700, background:'#f7971e15', color:'#f7971e', border:'1px solid #f7971e30', cursor:'pointer', fontFamily:'system-ui' }}>
          📚 Concept Card
        </button>
      </div>

      {show && (
        <div style={{ background:'#1a1d27', border:'1px solid #6c63ff40', borderRadius:12, padding:16, marginLeft:36, marginTop:12 }}>
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
