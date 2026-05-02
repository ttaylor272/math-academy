export type Twin = 'tim' | 'jason'
export type MCAPTopic = 'ratios' | 'number_system' | 'expressions' | 'geometry' | 'statistics'
export type MAPTopic = 'operations' | 'ratios_map' | 'algebra_map' | 'geometry_map' | 'data_map'
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
  ratios: TopicStats; number_system: TopicStats; expressions: TopicStats
  geometry: TopicStats; statistics: TopicStats; operations: TopicStats
  ratios_map: TopicStats; algebra_map: TopicStats; geometry_map: TopicStats; data_map: TopicStats
}

export interface TwinData {
  name: string; streak: number; points: number; stats: TwinStats
  weekDays: number[]; lastPracticed: string | null; quizScores: number[]
  mapRitScore: number
}

export const TWIN_COLORS: Record<Twin, { primary: string }> = {
  tim: { primary: '#6c63ff' },
  jason: { primary: '#ff6b9d' },
}

export const MCAP_TOPICS: MCAPTopic[] = ['ratios', 'number_system', 'expressions', 'geometry', 'statistics']
export const MAP_TOPICS: MAPTopic[] = ['operations', 'ratios_map', 'algebra_map', 'geometry_map', 'data_map']
export const ALL_TOPICS: TopicKey[] = [...MCAP_TOPICS, ...MAP_TOPICS]

export const TOPIC_COLORS: Record<TopicKey, string> = {
  ratios: '#43e97b', number_system: '#f7971e', expressions: '#6c63ff',
  geometry: '#00d4ff', statistics: '#ff6b9d', operations: '#f7971e',
  ratios_map: '#43e97b', algebra_map: '#6c63ff', geometry_map: '#00d4ff', data_map: '#ff6b9d',
}

export const TOPIC_LABELS: Record<TopicKey, string> = {
  ratios: 'Ratios & Proportions', number_system: 'Number System',
  expressions: 'Expressions & Equations', geometry: 'Geometry', statistics: 'Statistics',
  operations: 'Operations & Numbers', ratios_map: 'Ratios & Rates',
  algebra_map: 'Algebraic Thinking', geometry_map: 'Geometry & Measurement', data_map: 'Data & Statistics',
}

export const TOPIC_ICONS: Record<TopicKey, string> = {
  ratios: '📐', number_system: '➕➖', expressions: '🔢', geometry: '📏', statistics: '📊',
  operations: '🧮', ratios_map: '📐', algebra_map: '🔢', geometry_map: '📏', data_map: '📊',
}

export const defaultTwinData = (name: string): TwinData => ({
  name, streak: 0, points: 0, mapRitScore: 215,
  stats: {
    ratios: { correct: 0, total: 0 }, number_system: { correct: 0, total: 0 },
    expressions: { correct: 0, total: 0 }, geometry: { correct: 0, total: 0 },
    statistics: { correct: 0, total: 0 }, operations: { correct: 0, total: 0 },
    ratios_map: { correct: 0, total: 0 }, algebra_map: { correct: 0, total: 0 },
    geometry_map: { correct: 0, total: 0 }, data_map: { correct: 0, total: 0 },
  },
  weekDays: [0, 0, 0, 0, 0, 0, 0],
  lastPracticed: null, quizScores: [],
})
