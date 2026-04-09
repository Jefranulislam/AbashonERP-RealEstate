/**
 * SMS Service for KH ERP
 * Supports multiple SMS providers (configurable)
 * Currently supports: BulkSMSBD, SSL Wireless, Custom HTTP API
 */

import { sql } from "@/lib/db"

interface SMSConfig {
  apiKey: string
  senderId: string
  apiUrl?: string
  provider?: string
}

interface SMSVariables {
  customer_name?: string
  amount?: string
  unit_name?: string
  project_name?: string
  sale_no?: string
  receipt_no?: string
  outstanding?: string
  due_date?: string
  [key: string]: string | undefined
}

interface SendSMSParams {
  templateType?: string
  phone: string
  message?: string
  variables?: SMSVariables
  referenceType?: string
  referenceId?: number
}

/**
 * Get SMS configuration from settings
 */
async function getSMSConfig(): Promise<SMSConfig | null> {
  try {
    const settings = await sql`
      SELECT sms_api_key, sms_sender_id, sms_enabled 
      FROM settings 
      LIMIT 1
    `
    
    if (!settings[0]?.sms_enabled || !settings[0]?.sms_api_key) {
      return null
    }

    return {
      apiKey: settings[0].sms_api_key,
      senderId: settings[0].sms_sender_id || 'KHERP'
    }
  } catch (error) {
    console.error("Error getting SMS config:", error)
    return null
  }
}

/**
 * Get SMS template by type and replace variables
 */
async function getTemplateMessage(templateType: string, variables: SMSVariables): Promise<string | null> {
  try {
    const template = await sql`
      SELECT message_template 
      FROM sms_templates 
      WHERE template_type = ${templateType} AND is_active = true
      LIMIT 1
    `

    if (template.length === 0) {
      return null
    }

    let message = template[0].message_template

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
    })

    return message
  } catch (error) {
    console.error("Error getting SMS template:", error)
    return null
  }
}

/**
 * Log SMS notification
 */
async function logSMS(params: {
  phone: string
  templateName?: string
  message: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  errorMessage?: string
  referenceType?: string
  referenceId?: number
}) {
  try {
    await sql`
      INSERT INTO notification_logs (
        notification_type, recipient_phone, template_name,
        message, status, error_message,
        reference_type, reference_id,
        sent_at
      ) VALUES (
        'sms',
        ${params.phone},
        ${params.templateName || null},
        ${params.message},
        ${params.status},
        ${params.errorMessage || null},
        ${params.referenceType || null},
        ${params.referenceId || null},
        ${params.status === 'sent' ? new Date() : null}
      )
    `
  } catch (error) {
    console.error("Error logging SMS:", error)
  }
}

/**
 * Send SMS using configured provider
 * This is a placeholder - implement actual SMS API call based on your provider
 */
async function callSMSAPI(phone: string, message: string, config: SMSConfig): Promise<boolean> {
  // Normalize phone number (Bangladesh format)
  let normalizedPhone = phone.replace(/\D/g, '')
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '88' + normalizedPhone
  } else if (!normalizedPhone.startsWith('88')) {
    normalizedPhone = '88' + normalizedPhone
  }

  // Example implementation for BulkSMSBD API
  // Replace with your actual SMS provider API
  try {
    const apiUrl = `https://bulksmsbd.net/api/smsapi`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        senderid: config.senderId,
        number: normalizedPhone,
        message: message
      })
    })

    const result = await response.json()
    
    // Check response based on your SMS provider's response format
    if (result.response_code === 202 || result.status === 'success') {
      return true
    }
    
    console.error("SMS API error:", result)
    return false
  } catch (error) {
    console.error("SMS API call failed:", error)
    return false
  }
}

/**
 * Main function to send SMS
 */
export async function sendSMS(params: SendSMSParams): Promise<{ success: boolean; message: string }> {
  const { templateType, phone, message: directMessage, variables = {}, referenceType, referenceId } = params

  // Validate phone number
  if (!phone || phone.length < 10) {
    return { success: false, message: "Invalid phone number" }
  }

  // Get SMS config
  const config = await getSMSConfig()
  if (!config) {
    return { success: false, message: "SMS not configured or disabled" }
  }

  // Get message (from template or direct)
  let message: string | undefined = directMessage ?? undefined
  if (!message && templateType) {
    message = (await getTemplateMessage(templateType, variables)) ?? undefined
  }

  if (!message) {
    return { success: false, message: "No message content" }
  }

  // Log pending SMS
  await logSMS({
    phone,
    templateName: templateType,
    message,
    status: 'pending',
    referenceType,
    referenceId
  })

  // Send SMS
  const success = await callSMSAPI(phone, message, config)

  // Update log with result
  if (success) {
    await logSMS({
      phone,
      templateName: templateType,
      message,
      status: 'sent',
      referenceType,
      referenceId
    })
    return { success: true, message: "SMS sent successfully" }
  } else {
    await logSMS({
      phone,
      templateName: templateType,
      message,
      status: 'failed',
      errorMessage: 'API call failed',
      referenceType,
      referenceId
    })
    return { success: false, message: "Failed to send SMS" }
  }
}

/**
 * Send bulk SMS for payment reminders
 */
export async function sendPaymentReminders(): Promise<{ sent: number; failed: number }> {
  const config = await getSMSConfig()
  if (!config) {
    return { sent: 0, failed: 0 }
  }

  // Get reminder days from settings
  const settings = await sql`
    SELECT payment_reminder_days FROM settings LIMIT 1
  `
  const reminderDays = settings[0]?.payment_reminder_days || 3

  // Get upcoming due payments
  const duePayments = await sql`
    SELECT 
      sps.id as schedule_id,
      sps.due_date,
      sps.amount,
      sps.paid_amount,
      s.sale_no,
      c.customer_name,
      c.phone,
      p.project_name,
      pr.product_name,
      pr.unit_no
    FROM sale_payment_schedules sps
    JOIN sales s ON sps.sale_id = s.id
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN projects p ON s.project_id = p.id
    LEFT JOIN products pr ON s.product_id = pr.id
    WHERE sps.is_active = true 
      AND sps.status NOT IN ('paid')
      AND sps.due_date = (CURRENT_DATE + ${reminderDays}::INTEGER)
      AND s.is_active = true
      AND c.phone IS NOT NULL
  `

  let sent = 0
  let failed = 0

  for (const payment of duePayments) {
    const result = await sendSMS({
      templateType: 'payment_reminder',
      phone: payment.phone,
      variables: {
        customer_name: payment.customer_name,
        amount: (payment.amount - payment.paid_amount).toLocaleString(),
        unit_name: payment.product_name + (payment.unit_no ? ' (' + payment.unit_no + ')' : ''),
        due_date: new Date(payment.due_date).toLocaleDateString()
      },
      referenceType: 'reminder',
      referenceId: payment.schedule_id
    })

    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  return { sent, failed }
}

/**
 * Send overdue payment notifications
 */
export async function sendOverdueNotifications(): Promise<{ sent: number; failed: number }> {
  const config = await getSMSConfig()
  if (!config) {
    return { sent: 0, failed: 0 }
  }

  // Get overdue payments (not notified today)
  const overduePayments = await sql`
    SELECT DISTINCT ON (c.id)
      sps.id as schedule_id,
      sps.due_date,
      sps.amount,
      sps.paid_amount,
      s.sale_no,
      c.id as customer_id,
      c.customer_name,
      c.phone,
      p.project_name,
      pr.product_name,
      pr.unit_no,
      (CURRENT_DATE - sps.due_date) as days_overdue
    FROM sale_payment_schedules sps
    JOIN sales s ON sps.sale_id = s.id
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN projects p ON s.project_id = p.id
    LEFT JOIN products pr ON s.product_id = pr.id
    WHERE sps.is_active = true 
      AND sps.status NOT IN ('paid')
      AND sps.due_date < CURRENT_DATE
      AND s.is_active = true
      AND c.phone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notification_logs nl 
        WHERE nl.reference_type = 'overdue' 
          AND nl.reference_id = sps.id 
          AND nl.created_at::date = CURRENT_DATE
      )
    ORDER BY c.id, sps.due_date ASC
  `

  let sent = 0
  let failed = 0

  for (const payment of overduePayments) {
    const result = await sendSMS({
      templateType: 'payment_overdue',
      phone: payment.phone,
      variables: {
        customer_name: payment.customer_name,
        amount: (payment.amount - payment.paid_amount).toLocaleString(),
        unit_name: payment.product_name + (payment.unit_no ? ' (' + payment.unit_no + ')' : ''),
        due_date: new Date(payment.due_date).toLocaleDateString()
      },
      referenceType: 'overdue',
      referenceId: payment.schedule_id
    })

    if (result.success) {
      sent++
    } else {
      failed++
    }
  }

  return { sent, failed }
}
