export type Twin = 'tim' | 'jason'

// Advanced MCAP topics (7th grade level)
export type MCAPTopic = 'rational_numbers' | 'proportional' | 'expressions_equations' | 'geometry' | 'statistics_probability'
// Advanced MAP topics (7th grade level)
export type MAPTopic = 'number_operations' | 'ratio_proportion' | 'algebra' | 'geometry_adv' | 'data_probability'
// Topics that actually showed up on the Maryland assessment the boys just took
export type MDTopic = 'ratios_basic' | 'mean_average' | 'time_elapsed' | 'speed_distance' | 'area_figures'
// White Oak Math 6 units that aren't already covered by an MD topic
// (Unit 1 Area → area_figures, Unit 2 Ratios → ratios_basic)
export type SchoolTopic = 'rates_percentages' | 'dividing_fractions' | 'decimal_arithmetic' | 'expressions_6'
export type TopicKey = MCAPTopic | MAPTopic | MDTopic | SchoolTopic

// ── Figures (diagram-based problems) ──────────────────────────
export type FigureType = 'parallelogram' | 'triangle' | 'rectangle' | 'trapezoid' | 'prism'

export interface QuestionFigure {
  type: FigureType
  unit?: string          // 'cm', 'in', 'ft' — appended to every label
  base?: number          // bottom side (parallelogram, triangle); length for rectangle/prism
  height?: number        // PERPENDICULAR height (dashed line); vertical edge for a prism
  slant?: number         // slanted side — the classic parallelogram distractor
  base2?: number         // trapezoid: top base
  width?: number         // rectangle/prism: width (depth for a prism)
  showHeight?: boolean   // default true — draw the dashed perpendicular height
  caption?: string       // optional extra note under the figure
}

export interface Question {
  topic: string
  testType?: 'mcap' | 'map' | 'md' | 'school'
  subtopic?: string
  question: string
  choices: string[]
  correct: number
  explanation: string
  figure?: QuestionFigure
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
  // Maryland assessment skills
  ratios_basic: TopicStats
  mean_average: TopicStats
  time_elapsed: TopicStats
  speed_distance: TopicStats
  area_figures: TopicStats
  // White Oak Math 6 units
  rates_percentages: TopicStats
  dividing_fractions: TopicStats
  decimal_arithmetic: TopicStats
  expressions_6: TopicStats
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
export const MD_TOPICS: MDTopic[] = ['ratios_basic', 'mean_average', 'time_elapsed', 'speed_distance', 'area_figures']
export const SCHOOL_ONLY_TOPICS: SchoolTopic[] = ['rates_percentages', 'dividing_fractions', 'decimal_arithmetic', 'expressions_6']
export const ALL_TOPICS: TopicKey[] = [...MCAP_TOPICS, ...MAP_TOPICS, ...MD_TOPICS, ...SCHOOL_ONLY_TOPICS]

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
  // Maryland assessment
  ratios_basic: '#43e97b',
  mean_average: '#ff6b9d',
  time_elapsed: '#f7971e',
  speed_distance: '#6c63ff',
  area_figures: '#00d4ff',
  // White Oak units
  rates_percentages: '#f7971e',
  dividing_fractions: '#6c63ff',
  decimal_arithmetic: '#43e97b',
  expressions_6: '#ff6b9d',
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
  // Maryland assessment
  ratios_basic: 'Ratios & Unit Rates',
  mean_average: 'Mean & Averages',
  time_elapsed: 'Time & Elapsed Time',
  speed_distance: 'Speed, Distance & Time',
  area_figures: 'Area, Parallelograms & Surface Area',
  // White Oak units
  rates_percentages: 'Rates & Percentages',
  dividing_fractions: 'Dividing Fractions',
  decimal_arithmetic: 'Decimal Arithmetic',
  expressions_6: 'Expressions & Equations (Gr 6)',
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
  // Maryland assessment
  ratios_basic: '⚖️',
  mean_average: '📊',
  time_elapsed: '⏰',
  speed_distance: '🚗',
  area_figures: '🟦',
  // White Oak units
  rates_percentages: '💯',
  dividing_fractions: '➗',
  decimal_arithmetic: '🔟',
  expressions_6: '🟰',
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
    ratios_basic: { correct: 0, total: 0 },
    mean_average: { correct: 0, total: 0 },
    time_elapsed: { correct: 0, total: 0 },
    speed_distance: { correct: 0, total: 0 },
    area_figures: { correct: 0, total: 0 },
    rates_percentages: { correct: 0, total: 0 },
    dividing_fractions: { correct: 0, total: 0 },
    decimal_arithmetic: { correct: 0, total: 0 },
    expressions_6: { correct: 0, total: 0 },
  },
  weekDays: [0, 0, 0, 0, 0, 0, 0],
  lastPracticed: null,
  quizScores: [],
})
