export type Twin = 'tim' | 'jason'

// Advanced MCAP topics (7th grade level)
export type MCAPTopic = 'rational_numbers' | 'proportional' | 'expressions_equations' | 'geometry' | 'statistics_probability'
// Advanced MAP topics (7th grade level)
export type MAPTopic = 'number_operations' | 'ratio_proportion' | 'algebra' | 'geometry_adv' | 'data_probability'
export type TopicKey = MCAPTopic | MAPTopic

export interface Question {
  topic: string
  testType?: 'mcap' | 'map'
  subtopic?: string
  question: string
  choices: string[]
  correct: number
  explanation: string
}

export interface TopicStats { correct: number; total: number }

export interface TwinStats {
  // Advanced MCAP
  rational_numbers: TopicStats
  proportional: TopicStats
  expressions_equations: TopicStats
  geometry: TopicStats
  statistics_probability: TopicStats
  // Advanced MAP
  number_operations: TopicStats
  ratio_proportion: TopicStats
  algebra: TopicStats
  geometry_adv: TopicStats
  data_probability: TopicStats
}

export interface TwinData {
  name: string
  streak: number
  points: number
  stats: TwinStats
  weekDays: number[]
  lastPracticed: string | null
  quizScores: number[]
  mapRitScore: number
}

export const TWIN_COLORS: Record<Twin, { primary: string }> = {
  tim: { primary: '#6c63ff' },
  jason: { primary: '#ff6b9d' },
}

export const MCAP_TOPICS: MCAPTopic[] = ['rational_numbers', 'proportional', 'expressions_equations', 'geometry', 'statistics_probability']
export const MAP_TOPICS: MAPTopic[] = ['number_operations', 'ratio_proportion', 'algebra', 'geometry_adv', 'data_probability']
export const ALL_TOPICS: TopicKey[] = [...MCAP_TOPICS, ...MAP_TOPICS]

export const TOPIC_COLORS: Record<TopicKey, string> = {
  // MCAP
  rational_numbers: '#f7971e',
  proportional: '#43e97b',
  expressions_equations: '#6c63ff',
  geometry: '#00d4ff',
  statistics_probability: '#ff6b9d',
  // MAP
  number_operations: '#f7971e',
  ratio_proportion: '#43e97b',
  algebra: '#6c63ff',
  geometry_adv: '#00d4ff',
  data_probability: '#ff6b9d',
}

export const TOPIC_LABELS: Record<TopicKey, string> = {
  // MCAP
  rational_numbers: 'Rational Numbers',
  proportional: 'Proportional Relationships',
  expressions_equations: 'Expressions & Equations',
  geometry: 'Geometry',
  statistics_probability: 'Statistics & Probability',
  // MAP
  number_operations: 'Number & Operations',
  ratio_proportion: 'Ratios & Proportional',
  algebra: 'Algebra & Functions',
  geometry_adv: 'Geometry & Measurement',
  data_probability: 'Data & Probability',
}

export const TOPIC_ICONS: Record<TopicKey, string> = {
  // MCAP
  rational_numbers: '➕➖',
  proportional: '📐',
  expressions_equations: '🔢',
  geometry: '📏',
  statistics_probability: '🎲',
  // MAP
  number_operations: '🧮',
  ratio_proportion: '📐',
  algebra: '🔢',
  geometry_adv: '📏',
  data_probability: '🎲',
}

export const defaultTwinData = (name: string): TwinData => ({
  name, streak: 0, points: 0, mapRitScore: 228,
  stats: {
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
  },
  weekDays: [0, 0, 0, 0, 0, 0, 0],
  lastPracticed: null,
  quizScores: [],
})
