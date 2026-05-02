import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { topic, count = 5, difficulty = 'normal', testType = 'mixed', ritLevel = 215 } = await req.json()

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    let topicInstructions = ''
    let diffStr = ''

    if (testType === 'map') {
      topicInstructions = topic
        ? `Focus only on the MAP topic: ${topic}.`
        : `Mix MAP Growth domains: Operations & Numbers (2q - include negatives and decimals), Ratios & Rates (2q), Algebraic Thinking (2q), Geometry & Measurement (2q), Data & Statistics (2q).`
      diffStr = `Calibrate to RIT level ${ritLevel}. ${ritLevel >= 225 ? 'Use multi-step problems and abstract reasoning.' : ritLevel >= 215 ? 'Use two-step problems, include negatives and decimals.' : 'Single-step, whole numbers or simple fractions.'} Wrong choices must reflect common student mistakes.`
    } else if (testType === 'mcap') {
      topicInstructions = topic
        ? `Focus only on the MCAP topic: ${topic}.`
        : `Mix MCAP 6th grade domains: Ratios & Proportions (1q), Number System with negatives AND decimals (2q), Expressions & Equations (1q), Geometry or Statistics (1q).`
      diffStr = difficulty === 'hard'
        ? 'MCAP Level 3-4: multi-step, real-world, require deeper reasoning.'
        : 'MCAP Level 2-3: two-step problems, real-world contexts. Include negatives in 2+ questions.'
    } else {
      topicInstructions = `Mix MCAP and MAP 6th grade math: Number System with negatives and decimals (2q), Ratios/Rates (1q), Expressions/Algebra (1q), Geometry or Statistics (1q).`
      diffStr = 'Two-step problems, real-world contexts. Include negatives in at least 2 questions, decimals in at least 1.'
    }

    const prompt = `You are creating 6th grade math practice questions for the Maryland MCAP and NWEA MAP tests.

${topicInstructions}
${diffStr}

REQUIREMENTS:
- Include negative numbers in at least 2 questions (temperatures, debt, sea level, football yards lost)
- Include decimals in at least 1 question
- Wrong answer choices must be plausible — use common mistakes as distractors  
- Explanations must be step-by-step, clear for a 5th grader
- Use real-world scenarios kids relate to (sports, money, weather, food)

Generate exactly ${count} questions with 4 choices (A-D), ONE correct answer each.

Return ONLY valid JSON array, no markdown:
[{"topic":"number_system","testType":"mcap","subtopic":"negative numbers","question":"...","choices":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"Step 1: ... Step 2: ... The answer is ..."}]

Valid topic values: ratios, number_system, expressions, geometry, statistics, operations, ratios_map, algebra_map, geometry_map, data_map`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI error: ${response.status} ${err}` }, { status: 500 })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text
    if (!text) return NextResponse.json({ error: 'Empty AI response' }, { status: 500 })

    const questions = JSON.parse(text.replace(/```json|```/g, '').trim())
    return NextResponse.json({ questions })
  } catch (error) {
    console.error('Generate questions error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
