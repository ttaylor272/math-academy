import { NextResponse } from 'next/server'
// Called every Sunday at 8 PM to send parent weekly report
export async function GET() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://math-academy-seven.vercel.app'
    // Parent must send their state data via the parent dashboard
    // This just triggers a reminder — actual data sent from parent page
    return NextResponse.json({ message: 'Weekly report cron — trigger from parent dashboard' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
