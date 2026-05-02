import { Twin, TwinData, TwinStats, TopicKey, MCAP_TOPICS, MAP_TOPICS, defaultTwinData } from './types'

const STORAGE_KEY = 'mathAcademy_v5'

export interface AppState {
  tim: TwinData; jason: TwinData
  emailConfig: { timEmail: string; jasonEmail: string; parentEmail: string; deliveryTime: string }
}

function emptyStats(): TwinStats {
  return {
    ratios: { correct: 0, total: 0 }, number_system: { correct: 0, total: 0 },
    expressions: { correct: 0, total: 0 }, geometry: { correct: 0, total: 0 },
    statistics: { correct: 0, total: 0 }, operations: { correct: 0, total: 0 },
    ratios_map: { correct: 0, total: 0 }, algebra_map: { correct: 0, total: 0 },
    geometry_map: { correct: 0, total: 0 }, data_map: { correct: 0, total: 0 },
  }
}

function defaultState(): AppState {
  return {
    tim: defaultTwinData('Tim'),
    jason: defaultTwinData('Jason'),
    emailConfig: { timEmail: '', jasonEmail: '', parentEmail: '', deliveryTime: '8am' },
  }
}

function migrateStats(old: Record<string, { correct: number; total: number }>): TwinStats {
  const base = emptyStats()
  for (const key of Object.keys(base) as TopicKey[]) {
    if (old[key]) base[key] = old[key]
  }
  // migrate old 'algebra' to expressions
  if (old.algebra && !old.expressions) base.expressions = old.algebra
  return base
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    // try current version first
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.tim?.stats) parsed.tim.stats = migrateStats(parsed.tim.stats)
      if (parsed.jason?.stats) parsed.jason.stats = migrateStats(parsed.jason.stats)
      return { ...defaultState(), ...parsed }
    }
    // try older versions
    for (const key of ['mathAcademy_v4','mathAcademy_v3','mathAcademy_v2','mathAcademy_v1']) {
      const old = localStorage.getItem(key)
      if (old) {
        const parsed = JSON.parse(old)
        if (parsed.tim?.stats) parsed.tim.stats = migrateStats(parsed.tim.stats)
        if (parsed.jason?.stats) parsed.jason.stats = migrateStats(parsed.jason.stats)
        return { ...defaultState(), ...parsed }
      }
    }
  } catch {}
  return defaultState()
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

export function pct(s: { correct: number; total: number }) {
  return s.total ? Math.round(s.correct / s.total * 100) : 0
}

export function getRank(points: number) {
  if (points >= 500) return 'Math Master 🏆'
  if (points >= 300) return 'Math Champion ⭐'
  if (points >= 150) return 'Math Pro 🎯'
  if (points >= 75) return 'Math Explorer 🔍'
  if (points >= 25) return 'Math Rookie 📚'
  return 'Getting Started!'
}

export function getWeakTopics(data: TwinData, test: 'mcap' | 'map' | 'all' = 'all'): TopicKey[] {
  const topics = test === 'mcap' ? MCAP_TOPICS : test === 'map' ? MAP_TOPICS : [...MCAP_TOPICS, ...MAP_TOPICS]
  return (topics as TopicKey[])
    .filter(t => data.stats[t].total >= 3 && data.stats[t].correct / data.stats[t].total < 0.65)
    .sort((a, b) => (data.stats[a].correct / Math.max(data.stats[a].total, 1)) - (data.stats[b].correct / Math.max(data.stats[b].total, 1)))
}

export function estimateMCAPScore(data: TwinData) {
  const total = MCAP_TOPICS.reduce((s, t) => s + data.stats[t].total, 0)
  if (total < 5) return 0
  const correct = MCAP_TOPICS.reduce((s, t) => s + data.stats[t].correct, 0)
  return Math.round(200 + (correct / total) * 80)
}

export function estimateRITScore(data: TwinData) {
  const total = MAP_TOPICS.reduce((s, t) => s + data.stats[t].total, 0)
  if (total < 5) return 0
  const correct = MAP_TOPICS.reduce((s, t) => s + data.stats[t].correct, 0)
  return Math.round(200 + (correct / total) * 45)
}

export function getMCAPLabel(score: number) {
  if (score === 0) return 'Practice to see score'
  if (score >= 240) return '🏆 Distinguished!'
  if (score >= 230) return '✅ Proficient!'
  if (score >= 220) return '⚠️ Almost there!'
  return '📚 Keep practicing!'
}

export function getRITLabel(score: number) {
  if (score === 0) return 'Practice to see score'
  if (score >= 230) return '🏆 Advanced!'
  if (score >= 220) return '✅ On Grade Level!'
  if (score >= 210) return '⚠️ Approaching'
  return '📚 Needs Work'
}
