import { type NextRequest, NextResponse } from "next/server"
import { sendPaymentReminders, sendOverdueNotifications } from "@/lib/sms-service"

/**
 * CRON Job endpoint for automated payment reminders
 * Should be called daily (e.g., via Vercel Cron or external scheduler)
 * 
 * Vercel cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/payment-reminders",
 *     "schedule": "0 9 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results = {
      reminders: { sent: 0, failed: 0 },
      overdue: { sent: 0, failed: 0 },
      timestamp: new Date().toISOString()
    }

    // Send payment reminders (X days before due date)
    const reminderResult = await sendPaymentReminders()
    results.reminders = reminderResult

    // Send overdue notifications
    const overdueResult = await sendOverdueNotifications()
    results.overdue = overdueResult

    console.log("Payment reminders cron completed:", results)

    return NextResponse.json({ 
      success: true, 
      message: "Payment reminders processed",
      results 
    })
  } catch (error) {
    console.error("Payment reminders cron error:", error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: String(error) 
    }, { status: 500 })
  }
}
