import { NextRequest, NextResponse } from 'next/server'
import { generateUnit1Questions, asEntry, SCHOOL_TOPIC } from '@/lib/unit1'
import { getUnitForTopic } from '@/lib/schedule'

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

// ── Maryland assessment skills (what actually showed up on the state test) ─────
const MD_ASSESSMENT = {
  ratios_basic: {
    label: 'Ratios & Unit Rates',
    subtopics: [
      'writing ratios in part-to-part and part-to-whole form',
      'double number lines and tape diagrams for ratios',
      'equivalent ratios and ratio tables',
      'solving proportions with a missing value',
      'unit rate and unit price (best buy comparisons)',
      'recipe and scaling problems',
      'ratio word problems with a total given',
    ],
  },
  mean_average: {
    label: 'Mean & Averages',
    subtopics: [
      'finding the mean of a data set',
      'mean vs median vs mode vs range',
      'finding a missing value when the mean is known',
      'what score is needed to reach a target average',
      'how an outlier or a new value changes the mean',
      'comparing two data sets using the mean',
    ],
  },
  time_elapsed: {
    label: 'Time & Elapsed Time',
    subtopics: [
      'elapsed time between two clock times (including crossing noon/midnight)',
      'working backward from an end time to a start time',
      'converting hours/minutes/seconds and decimal hours',
      'adding several durations in a schedule',
      'multi-step schedule problems (travel, practice, chores)',
    ],
  },
  speed_distance: {
    label: 'Speed, Distance & Time',
    subtopics: [
      'distance = speed x time and its rearrangements',
      'finding average speed from total distance and total time',
      'comparing two speeds given in different units',
      'time needed to cover a distance at a given speed',
      'multi-leg trips where the speed changes',
    ],
  },
  area_figures: {
    label: 'Area & Parallelograms',
    subtopics: [
      'area of a parallelogram (base x perpendicular height)',
      'choosing the height instead of the slanted side',
      'rearranging a parallelogram into a rectangle to explain its area',
      'matching each base of a parallelogram with its own perpendicular height',
      'enclosing a polygon in a rectangle and subtracting the corner triangles',
      'nets of prisms and pyramids',
      'surface area of rectangular prisms and cubes',
      'area of triangles and trapezoids',
      'area and perimeter of rectangles and squares',
      'finding a missing base or height when the area is given',
      'area of composite figures made of rectangles and triangles',
      'perimeter vs area in the same problem',
    ],
  },
}

// ── White Oak Math 6 units not already covered above ─────────────
const SCHOOL_BANK = {
  rates_percentages: {
    label: 'Rates & Percentages',
    subtopics: [
      'unit rates and the two unit rates in every ratio',
      'comparing rates to find the better deal or faster speed',
      'equivalent ratios share the same unit rate',
      'finding a percent of a number (the part)',
      'finding the whole when a part and percent are known',
      'finding what percent one number is of another',
      'double number lines and tape diagrams for percentages',
    ],
  },
  dividing_fractions: {
    label: 'Dividing Fractions',
    subtopics: [
      '"how many groups?" fraction division word problems',
      '"how much in 1 group?" fraction division word problems',
      'dividing a fraction by a fraction using the reciprocal',
      'dividing with common denominators',
      'dividing mixed numbers',
      'tape diagrams for fraction division',
      'fraction division in area and length problems (missing side)',
    ],
  },
  decimal_arithmetic: {
    label: 'Decimal Arithmetic',
    subtopics: [
      'adding and subtracting decimals with different place values',
      'multiplying decimals and placing the decimal point',
      'dividing whole numbers and decimals by decimals',
      'estimating to check decimal answers',
      'multi-step money problems with decimals',
    ],
  },
  expressions_6: {
    label: 'Expressions & Equations (Grade 6)',
    subtopics: [
      'solving one-step equations with balanced operations',
      'writing an equation from a word problem or tape diagram',
      'equivalent expressions with the distributive property',
      'combining like terms with two variables',
      'evaluating expressions with whole-number exponents',
      'order of operations with exponents',
    ],
  },
}

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5, difficulty = 'normal', testType = 'mixed', ritLevel = 228, typeIn = 0.4 } = await req.json()
    const typeInShare = Math.max(0, Math.min(1, Number(typeIn)))

    // Unit 1 (Area & Surface Area) is built in code, not by the AI: guaranteed-correct
    // answer keys, diagrams drawn from the same numbers, and no API call needed.
    if (topic === SCHOOL_TOPIC) {
      return NextResponse.json({ questions: generateUnit1Questions(Math.min(Number(count) || 5, 10), 'unit1', typeInShare) })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    let topicInstructions = ''
    let diffStr = ''
    let testContext = ''

    // A topic can be drilled directly no matter which test bucket it lives in
    const ALL_BANKS: Record<string, { label: string; subtopics: string[] }> = {
      ...ADVANCED_MCAP, ...ADVANCED_MAP, ...MD_ASSESSMENT, ...SCHOOL_BANK,
    }
    const drilled = topic ? ALL_BANKS[topic as string] : undefined

    const schoolUnit = topic ? getUnitForTopic(topic as string) : undefined

    if (drilled && schoolUnit) {
      testContext = `These students are advanced 6th graders. Their class (MCPS Math 6, Amplify Desmos Math) is on Unit ${schoolUnit.unit}: ${schoolUnit.title}. The unit covers: ${schoolUnit.summary} Match the vocabulary and representations their class uses.`
      topicInstructions = `Focus ONLY on: ${drilled.label}. Subtopics: ${drilled.subtopics.join(', ')}.`
      diffStr = difficulty === 'hard'
        ? 'District-assessment level: multi-step, explain-your-reasoning style problems, with realistic distractors.'
        : 'On grade-6 standard but on the challenging end — these are advanced students. Two-step problems in real contexts.'

    } else if (drilled) {
      const isMd = topic in MD_ASSESSMENT
      testContext = isMd
        ? `These students are advanced 6th graders. This skill appeared on the Maryland state assessment they just took, so accuracy on it matters more than difficulty.`
        : `These students are advanced 6th graders working at 7th grade math level. MCAP target 240+, MAP target RIT 228+.`
      topicInstructions = `Focus ONLY on: ${drilled.label}. Subtopics: ${drilled.subtopics.join(', ')}.`
      diffStr = difficulty === 'hard'
        ? 'Multi-step problems that require choosing the right operation, with realistic distractors.'
        : 'Two-step problems in real-world contexts, with realistic distractors.'

    } else if (testType === 'md') {
      testContext = `These are advanced 6th graders. These questions cover the exact skills that appeared on the Maryland state assessment they just took.`
      topicInstructions = `Mix the Maryland assessment skills:
- Ratios & Unit Rates (1q): equivalent ratios, unit price, proportions
- Mean & Averages (1q): mean, missing value, target average
- Time & Elapsed Time (1q): elapsed time, converting hours and minutes
- Speed, Distance & Time (1q): d = s x t in a real context
- Area & Parallelograms (1q): area of a parallelogram or composite figure (include a figure)`
      diffStr = 'Two-step problems with realistic numbers. Distractors must be the actual mistakes kids make on these skills.'

    } else if (testType === 'map') {
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
      topicInstructions = `Mix advanced 7th grade math with the Maryland assessment skills:
- Rational Numbers with ALL operations including negatives (1q)
- Proportional relationships, percent change, or simple interest (1q)
- Two-step equations or linear functions (1q)
- Area & Parallelograms — include a figure (1q)
- ONE of: mean/averages, elapsed time, speed-distance-time, or ratios & unit rates (1q)`
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
6. MEAN: For "what score is needed" problems, give every existing value explicitly
7a. FRACTIONS: write fractions as a/b and mixed numbers as "2 1/2" so they are unambiguous
7. ELAPSED TIME: Always give a.m./p.m. (or use a 24-hour clock) so the interval is unambiguous
8. SPEED/DISTANCE: State the units for every number, and make units either match or clearly need converting
9. RATIOS: Say explicitly whether the ratio is part-to-part or part-to-whole
10. AREA: Always state the units, and answer choices for area must use SQUARE units
11. Be specific and clear — these kids are sharp but need complete information

FIGURE RULES (diagram questions):
- A question about the area or perimeter of a parallelogram, triangle, trapezoid or rectangle, or the surface area of a rectangular prism, SHOULD include a "figure" object. Do NOT describe the picture in the question text — the app draws it from the numbers you supply.
- "figure": { "type": "parallelogram"|"triangle"|"trapezoid"|"rectangle"|"prism", "unit": "cm", "base": 12, "height": 8, "slant": 10, "base2": 7, "width": 5 }
- parallelogram/triangle: give base and height. Also give "slant" (the slanted side) whenever you want the classic trap — one wrong choice should be base x slant.
- trapezoid: give base (bottom, b2), base2 (top, b1) and height. rectangle: give base and width.
- prism (rectangular prism / box, for surface area): give base (length), width and height.
- Numbers only — no coordinates, no SVG, no extra fields. The figure is labelled automatically and marked "not drawn to scale".
- Use "figure" ONLY for those five shapes. Leave it out entirely for every other question.

CRITICAL EXPLANATION RULE:
- "correct" is 0-based index (0=A, 1=B, 2=C, 3=D)
- Explanation MUST reference the correct letter
- Final sentence MUST be: "The answer is [correct letter]. [correct answer text]."
- Double-check your answer letter matches the correct index before writing

Generate exactly ${count} questions with 4 choices (A-D), ONE correct answer each.

Return ONLY valid JSON array, no markdown:
[{
  "topic": "rational_numbers"|"proportional"|"expressions_equations"|"geometry"|"statistics_probability"|"number_operations"|"ratio_proportion"|"algebra"|"geometry_adv"|"data_probability"|"ratios_basic"|"mean_average"|"time_elapsed"|"speed_distance"|"area_figures"|"rates_percentages"|"dividing_fractions"|"decimal_arithmetic"|"expressions_6",
  "testType": "mcap"|"map"|"md"|"school",
  "subtopic": "specific subtopic e.g. 'percent change' or 'two-step equations'",
  "question": "full question text",
  "choices": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correct": 0,
  "explanation": "Step 1: ... Step 2: ... Step 3: ... The answer is A. [text].",
  "figure": { "type": "parallelogram", "unit": "cm", "base": 12, "height": 8, "slant": 10 }
}]`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 3400, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI error: ${response.status} ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })

    const questions = JSON.parse(text.replace(/```json|```/g, '').trim())

    // Keep only figures the renderer can actually draw, with numeric measurements
    const FIGURE_TYPES = ['parallelogram', 'triangle', 'trapezoid', 'rectangle', 'prism']
    const NUM_FIELDS = ['base', 'height', 'slant', 'base2', 'width']
    function cleanFigure(raw: unknown) {
      if (!raw || typeof raw !== 'object') return undefined
      const f = raw as Record<string, unknown>
      if (typeof f.type !== 'string' || !FIGURE_TYPES.includes(f.type)) return undefined
      const out: Record<string, unknown> = { type: f.type }
      if (typeof f.unit === 'string') out.unit = f.unit
      if (typeof f.caption === 'string') out.caption = f.caption
      for (const k of NUM_FIELDS) {
        const v = typeof f[k] === 'string' ? parseFloat(f[k] as string) : f[k]
        if (typeof v === 'number' && isFinite(v) && v > 0) out[k] = v
      }
      // A shape with no measurements on it is just decoration — drop it
      if (!NUM_FIELDS.some(k => k in out)) return undefined
      return out
    }

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
      const figure = cleanFigure(q.figure)
      // A drilled topic always feeds its own stats bucket, whatever label the model picked
      const out = { ...q, explanation, figure, ...(drilled ? { topic } : {}) }
      if (!figure) delete out.figure
      return out
    })

    // Turn some of them into type-ins so a session can't be guessed four-ways.
    // Only answers that are a single plain number qualify; at least one stays multiple choice.
    type Q = { choices: string[]; correct: number; explanation: string; entry?: ReturnType<typeof asEntry> }
    const eligible = (fixed as Q[])
      .map((q, i) => ({ i, entry: asEntry(q.choices[q.correct]?.substring(3) ?? '') }))
      .filter(e => e.entry)
    const wanted = Math.min(Math.round(fixed.length * typeInShare), Math.max(fixed.length - 1, 0), eligible.length)
    for (const { i, entry } of eligible.sort(() => Math.random() - 0.5).slice(0, wanted)) {
      const q = fixed[i] as Q
      q.entry = entry
      q.explanation = q.explanation.replace(/The answer is [A-D]\. /, 'The answer is ')
    }

    return NextResponse.json({ questions: fixed })
  } catch (error) {
    console.error('Generate questions error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
