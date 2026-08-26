import { NextRequest, NextResponse } from 'next/server'

// ── 7th Grade Advanced Math Standards ──────────────────────────
// MCAP Advanced 6th (7th grade content) - Target: 240+
// MAP Advanced - Target RIT: 228+

const ADVANCED_MCAP = {
  rational_numbers: {
    label: 'Rational Numbers',
    subtopics: [
      'adding and subtracting rational numbers (fractions, decimals, negatives)',
      'multiplying and dividing rational numbers',
      'converting between fractions, decimals, and percents',
      'absolute value and ordering rational numbers on a number line',
      'real-world problems with rational numbers (debt, temperature, elevation)',
      'properties of operations with rational numbers',
    ],
  },
  proportional: {
    label: 'Proportional Relationships',
    subtopics: [
      'unit rates with complex fractions',
      'proportional vs non-proportional relationships',
      'constant of proportionality (k) in tables, graphs, equations',
      'percent change: percent increase and decrease',
      'percent error and simple interest',
      'scale drawings and similar figures',
      'multi-step ratio and percent word problems',
    ],
  },
  expressions_equations: {
    label: 'Expressions & Equations',
    subtopics: [
      'writing and simplifying algebraic expressions',
      'combining like terms',
      'distributive property with variables',
      'solving two-step equations with rational numbers',
      'solving two-step inequalities and graphing on number line',
      'writing equations and inequalities from word problems',
      'dependent and independent variables',
    ],
  },
  geometry: {
    label: 'Geometry',
    subtopics: [
      'area and circumference of circles (using pi)',
      'area of composite figures including circles',
      'angle relationships: supplementary, complementary, vertical, adjacent',
      'triangle angle sum theorem',
      'surface area of prisms and pyramids',
      'volume of prisms and pyramids',
      'cross sections of 3D figures',
      'scale drawings and geometric constructions',
    ],
  },
  statistics_probability: {
    label: 'Statistics & Probability',
    subtopics: [
      'random sampling and valid inferences',
      'comparing two populations using measures of center and variability',
      'simple probability (theoretical vs experimental)',
      'compound probability and sample spaces',
      'probability of independent and dependent events',
      'tree diagrams and organized lists',
      'using probability to make predictions',
    ],
  },
}

const ADVANCED_MAP = {
  number_operations: {
    label: 'Number & Operations',
    subtopics: [
      'all operations with rational numbers including negatives',
      'exponents and scientific notation',
      'square roots and perfect squares',
      'order of operations with rational numbers',
      'absolute value in equations',
      'number properties and justification',
    ],
  },
  ratio_proportion: {
    label: 'Ratios & Proportional Reasoning',
    subtopics: [
      'proportional relationships and unit rates',
      'percent increase, decrease, and error',
      'simple interest and tax/tip/discount',
      'scale factors and similar figures',
      'slope as unit rate in graphs',
      'constant of proportionality in multiple representations',
    ],
  },
  algebra: {
    label: 'Algebra & Functions',
    subtopics: [
      'solving two-step and multi-step equations',
      'solving and graphing inequalities',
      'functions: input/output, domain, range',
      'linear functions and slope-intercept form (y = mx + b)',
      'graphing linear equations',
      'writing equations from tables and graphs',
      'systems of equations: introduction',
    ],
  },
  geometry_adv: {
    label: 'Geometry & Measurement',
    subtopics: [
      'circles: area and circumference',
      'angle relationships and triangle theorems',
      'surface area and volume of complex figures',
      'Pythagorean theorem introduction',
      'transformations: translations, reflections, rotations, dilations',
      'coordinate geometry with all four quadrants',
      'cross sections of 3D figures',
    ],
  },
  data_probability: {
    label: 'Data, Statistics & Probability',
    subtopics: [
      'comparing data sets using box plots and histograms',
      'theoretical and experimental probability',
      'compound events and sample spaces',
      'random sampling and statistical inference',
      'scatter plots and trend lines',
      'making predictions from data',
    ],
  },
}

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5, difficulty = 'normal', testType = 'mixed', ritLevel = 228 } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    let topicInstructions = ''
    let diffStr = ''
    let testContext = ''

    if (testType === 'map') {
      testContext = `These students are advanced 6th graders working at 7th grade math level. MAP target RIT: 228+.`
      const topics = ADVANCED_MAP
      if (topic && topics[topic as keyof typeof topics]) {
        const t = topics[topic as keyof typeof topics]
        topicInstructions = `Focus on: ${t.label}. Subtopics: ${t.subtopics.join(', ')}.`
      } else {
        topicInstructions = `Mix advanced MAP domains:
- Number & Operations (2q): rational numbers, negatives, exponents
- Ratios & Proportional Reasoning (2q): percent change, proportional relationships
- Algebra & Functions (2q): two-step equations, linear functions
- Geometry & Measurement (2q): circles, angle relationships, transformations
- Data, Statistics & Probability (2q): probability, scatter plots`
      }
      diffStr = ritLevel >= 235
        ? 'RIT 235+: Multi-step abstract problems, algebraic reasoning, proof-based thinking.'
        : ritLevel >= 228
        ? 'RIT 228-234: Two and three-step problems, algebraic thinking, apply concepts to new situations.'
        : 'RIT 220-227: Apply 7th grade concepts in familiar contexts, moderate multi-step problems.'

    } else if (testType === 'mcap') {
      testContext = `These students are advanced 6th graders taking 7th grade MCAP. Target score: 240+.`
      const topics = ADVANCED_MCAP
      if (topic && topics[topic as keyof typeof topics]) {
        const t = topics[topic as keyof typeof topics]
        topicInstructions = `Focus ONLY on: ${t.label}. Subtopics: ${t.subtopics.join(', ')}.`
      } else {
        topicInstructions = `Mix advanced MCAP 7th grade domains:
- Rational Numbers (2q): operations with fractions, decimals, negatives
- Proportional Relationships (1q): percent change, constant of proportionality
- Expressions & Equations (2q): two-step equations or inequalities
- Geometry (2q): circles, angle relationships, or surface area/volume
- Statistics & Probability (1q): probability or comparing data sets`
      }
      diffStr = difficulty === 'hard'
        ? 'MCAP Level 3-4 (advanced): Multi-step, require algebraic reasoning, real-world application.'
        : 'MCAP Level 2-3 (advanced): Two-step problems, apply 7th grade concepts, real-world contexts.'

    } else {
      testContext = `These are advanced 6th graders working at 7th grade math level, preparing for both MCAP (target: 240+) and MAP (target RIT: 228+).`
      topicInstructions = `Mix advanced 7th grade math:
- Rational Numbers with ALL operations including negatives (2q)
- Proportional relationships, percent change, or simple interest (1q)  
- Two-step equations or linear functions (1q)
- Circles, angle relationships, or probability (1q)`
      diffStr = 'Two to three-step problems. Use negative numbers, fractions, and decimals throughout. Real-world contexts.'
    }

    const prompt = `${testContext}

${topicInstructions}
${diffStr}

REQUIREMENTS:
- Use negative numbers, fractions, and decimals regularly — these are advanced students
- Wrong answer choices must reflect REAL common mistakes at 7th grade level
- Explanations must be clear step-by-step, appropriate for advanced 6th graders
- Use engaging real-world contexts (sports stats, finance, science, social media, gaming)

QUESTION WRITING RULES:
1. MEDIAN/MEAN/MODE: Always say "arrange from least to greatest first" IN the question
2. CIRCLE problems: Always state whether to use π ≈ 3.14 or leave in terms of π
3. PROBABILITY: State whether events are independent or dependent when relevant
4. PERCENT CHANGE: Always clearly label what is the original and what is the new value
5. EQUATIONS: Write the full equation context — never leave out information
6. Be specific and clear — these kids are sharp but need complete information

CRITICAL EXPLANATION RULE:
- "correct" is 0-based index (0=A, 1=B, 2=C, 3=D)
- Explanation MUST reference the correct letter
- Final sentence MUST be: "The answer is [correct letter]. [correct answer text]."
- Double-check your answer letter matches the correct index before writing

Generate exactly ${count} questions with 4 choices (A-D), ONE correct answer each.

Return ONLY valid JSON array, no markdown:
[{
  "topic": "rational_numbers"|"proportional"|"expressions_equations"|"geometry"|"statistics_probability"|"number_operations"|"ratio_proportion"|"algebra"|"geometry_adv"|"data_probability",
  "testType": "mcap"|"map",
  "subtopic": "specific subtopic e.g. 'percent change' or 'two-step equations'",
  "question": "full question text",
  "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": 0,
  "explanation": "Step 1: ... Step 2: ... Step 3: ... The answer is A. [text]."
}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2800, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI error: ${response.status} ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })

    const questions = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Fix any wrong answer letters in explanations
    const letters = ['A', 'B', 'C', 'D']
    const fixed = questions.map((q: { correct: number; choices: string[]; explanation: string; [key: string]: unknown }) => {
      const correctLetter = letters[q.correct]
      const correctText = q.choices[q.correct].substring(3)
      let explanation = q.explanation
      explanation = explanation.replace(
        /The answer is [A-D]\.?[^.]*\./gi,
        `The answer is ${correctLetter}. ${correctText}.`
      )
      return { ...q, explanation }
    })

    return NextResponse.json({ questions: fixed })
  } catch (error) {
    console.error('Generate questions error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
