import { Twin, TwinData, TwinStats, TopicKey, MCAP_TOPICS, MAP_TOPICS, defaultTwinData } from './types'

const STORAGE_KEY = 'mathAcademy_v6'

export interface AppState {
  tim: TwinData
  jason: TwinData
  emailConfig: { timEmail: string; jasonEmail: string; parentEmail: string; deliveryTime: string }
}

function emptyStats(): TwinStats {
  return {
    rational_numbers: { correct: 0, total: 0 },
    proportional: { correct: 0, total: 0 },
    expressions_equations: { correct: 0, total: 0 },
    geometry: { correct: 0, total: 0 },
    statistics_probability: { correct: 0, total: 0 },
    number_operations: { correct: 0, total: 0 },
    ratio_proportion: { correct: 0, total: 0 },
    algebra: { correct: 0, total: 0 },
    geometry_adv: { correct: 0, total: 0 },
    data_probability: { correct: 0, total: 0 },
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
  // Map old topic keys to new ones where possible
  const mapping: Record<string, keyof TwinStats> = {
    rational_numbers: 'rational_numbers',
    proportional: 'proportional',
    expressions_equations: 'expressions_equations',
    geometry: 'geometry',
    statistics_probability: 'statistics_probability',
    number_operations: 'number_operations',
    ratio_proportion: 'ratio_proportion',
    algebra: 'algebra',
    geometry_adv: 'geometry_adv',
    data_probability: 'data_probability',
    // old topic names → best new match
    ratios: 'proportional',
    number_system: 'rational_numbers',
    expressions: 'expressions_equations',
    statistics: 'statistics_probability',
    operations: 'number_operations',
    ratios_map: 'ratio_proportion',
    algebra_map: 'algebra',
    geometry_map: 'geometry_adv',
    data_map: 'data_probability',
  }
  for (const [oldKey, newKey] of Object.entries(mapping)) {
    if (old[oldKey]) {
      base[newKey].correct += old[oldKey].correct
      base[newKey].total += old[oldKey].total
    }
  }
  return base
}

export function loadState(): AppState {
  if (typeof window === 'undefined') return defaultState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.tim?.stats) parsed.tim.stats = migrateStats(parsed.tim.stats)
      if (parsed.jason?.stats) parsed.jason.stats = migrateStats(parsed.jason.stats)
      return { ...defaultState(), ...parsed }
    }
    // Try older versions and migrate
    for (const key of ['mathAcademy_v5','mathAcademy_v4','mathAcademy_v3','mathAcademy_v2','mathAcademy_v1']) {
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
  if (points >= 750) return 'Advanced Math Legend 🏆'
  if (points >= 500) return 'Math Master ⭐'
  if (points >= 300) return 'Math Pro 🎯'
  if (points >= 150) return 'Math Explorer 🔍'
  if (points >= 50) return 'Math Rookie 📚'
  return 'Getting Started!'
}

export function getWeakTopics(data: TwinData, test: 'mcap' | 'map' | 'all' = 'all'): TopicKey[] {
  const topics = test === 'mcap' ? MCAP_TOPICS : test === 'map' ? MAP_TOPICS : [...MCAP_TOPICS, ...MAP_TOPICS]
  return (topics as TopicKey[])
    .filter(t => data.stats[t].total >= 3 && data.stats[t].correct / data.stats[t].total < 0.65)
    .sort((a, b) => (data.stats[a].correct / Math.max(data.stats[a].total, 1)) - (data.stats[b].correct / Math.max(data.stats[b].total, 1)))
}

// Advanced MCAP: 200-280 scale, proficient = 240 for advanced students
export function estimateMCAPScore(data: TwinData) {
  const total = MCAP_TOPICS.reduce((s, t) => s + data.stats[t].total, 0)
  if (total < 5) return 0
  const correct = MCAP_TOPICS.reduce((s, t) => s + data.stats[t].correct, 0)
  return Math.round(210 + (correct / total) * 80)
}

// Advanced MAP RIT: target 228+ for advanced 6th graders
export function estimateRITScore(data: TwinData) {
  const total = MAP_TOPICS.reduce((s, t) => s + data.stats[t].total, 0)
  if (total < 5) return 0
  const correct = MAP_TOPICS.reduce((s, t) => s + data.stats[t].correct, 0)
  return Math.round(210 + (correct / total) * 45)
}

export function getMCAPLabel(score: number) {
  if (score === 0) return 'Practice to see score'
  if (score >= 255) return '🏆 Distinguished!'
  if (score >= 240) return '✅ Advanced Proficient!'
  if (score >= 228) return '⚠️ Almost there!'
  return '📚 Keep practicing!'
}

export function getRITLabel(score: number) {
  if (score === 0) return 'Practice to see score'
  if (score >= 235) return '🏆 Exceptional!'
  if (score >= 228) return '✅ Advanced Level!'
  if (score >= 220) return '⚠️ Approaching goal'
  return '📚 Keep practicing!'
}
