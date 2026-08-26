import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  try {
    const { question, choices, correct, explanation } = await req.json()
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No API key' }, { status: 500 })
    const prompt = `An advanced 6th grader (doing 7th grade math) got this question wrong and still doesn't understand after reading the explanation.

Question: ${question}
Correct answer: ${choices[correct]}
Original explanation: ${explanation}

Give a DIFFERENT, SIMPLER explanation using:
- A real-world analogy or story they can picture
- Very clear step-by-step language
- A concrete example with actual numbers
- Encouragement at the end — remind them this is advanced math and it's okay to find it challenging

Keep it under 150 words. Be warm and encouraging.`
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await response.json()
    const text = data.content?.[0]?.text || 'Could not load explanation.'
    return NextResponse.json({ explanation: text })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
