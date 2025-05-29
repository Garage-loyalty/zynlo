import { Router, Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import crypto from 'crypto'
import { threadReconstructor } from '../../src/services/email/thread-reconstructor'
import { attachmentHandler } from '../../src/services/email/attachment-handler'

const router = Router()

// Initialize Supabase client
// Use NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as these are likely in .env.local
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
)

// Email webhook payload schema
const EmailWebhookSchema = z.object({
  messageId: z.string(),
  from: z.object({
    email: z.string().email(),
    name: z.string().optional(),
  }),
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })),
  cc: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).optional(),
  subject: z.string(),
  text: z.string().optional(),
  html: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    contentType: z.string(),
    size: z.number(),
    url: z.string().optional(),
    content: z.string().optional(),
  })).optional(),
  headers: z.record(z.string()).optional(),
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
  receivedAt: z.string().datetime().optional(),
})

type EmailWebhookPayload = z.infer<typeof EmailWebhookSchema>

// Helper function to find or create customer
async function findOrCreateCustomer(email: string, name?: string) {
  // Check if customer exists
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .single()

  if (existingCustomer) {
    return existingCustomer.id
  }

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
    .insert({
      email,
      name: name || email.split('@')[0],
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create customer: ${error.message}`)
  }

  return newCustomer.id
}

// Helper function to find email channel
async function findEmailChannel() {
  const { data: channel, error } = await supabase
    .from('channels')
    .select('id')
    .eq('type', 'email')
    .eq('is_active', true)
    .single()

  if (error || !channel) {
    throw new Error('No active email channel found')
  }

  return channel.id
}

// Process email webhook
router.post('/email', async (req: Request, res: Response) => {
  console.log('Email webhook received:', req.body)

  try {
    // Log the webhook receipt
    await supabase.from('webhook_logs').insert({
      channel_type: 'email',
      payload: req.body,
      headers: req.headers as any,
    })

    // Validate webhook signature if configured
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET
    if (webhookSecret) {
      const signature = req.headers['x-webhook-signature'] as string
      if (!signature) {
        return res.status(401).json({ error: 'Missing webhook signature' })
      }

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex')

      if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid webhook signature' })
      }
    }

    // Validate payload
    const payload = EmailWebhookSchema.parse(req.body)

    // Find or create customer
    const customerId = await findOrCreateCustomer(
      payload.from.email,
      payload.from.name
    )

    // Find email channel
    const channelId = await findEmailChannel()

    // Use thread reconstruction to find existing thread
    const existingThread = await threadReconstructor.findExistingThread(
      payload.messageId,
      payload.inReplyTo,
      payload.references,
      payload.subject,
      payload.from.email
    )

    let conversationId: string
    let ticketRecord: any

    if (existingThread) {
      // This is part of an existing thread
      conversationId = existingThread.conversationId
      
      // Get ticket details
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', existingThread.ticketId)
        .single()

      if (error || !ticket) {
        throw new Error(`Ticket not found`)
      }

      ticketRecord = ticket

      // Update ticket status if it was closed
      if (ticket.status === 'closed' || ticket.status === 'resolved') {
        await supabase
          .from('tickets')
          .update({ 
            status: 'open',
            updated_at: new Date().toISOString()
          })
          .eq('id', ticket.id)
      }
    } else {
      // This is a new email thread, create a new ticket
      
      // Create conversation first
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          channel_id: channelId,
          customer_id: customerId,
          metadata: {
            subject: payload.subject,
            from: payload.from,
            to: payload.to,
            messageId: payload.messageId,
          }
        })
        .select('id')
        .single()

      if (convError) {
        throw new Error(`Failed to create conversation: ${convError.message}`)
      }

      conversationId = conversation.id

      // Create ticket
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          subject: payload.subject,
          conversation_id: conversationId,
          customer_id: customerId,
          channel_id: channelId,
          status: 'new',
          priority: 'normal',
        })
        .select()
        .single()

      if (ticketError) {
        throw new Error(`Failed to create ticket: ${ticketError.message}`)
      }

      ticketRecord = ticket
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        content: payload.html || payload.text || '',
        content_type: payload.html ? 'html' : 'text',
        sender_type: 'customer',
        sender_id: customerId,
        metadata: {
          messageId: payload.messageId,
          from: payload.from,
          to: payload.to,
          cc: payload.cc,
          subject: payload.subject,
          headers: payload.headers,
          inReplyTo: payload.inReplyTo,
          references: payload.references,
          originalText: payload.text,
          originalHtml: payload.html,
        },
        // Don't include attachments here yet, they'll be processed separately
        attachments: []
      })
      .select()
      .single()

    if (messageError) {
      throw new Error(`Failed to create message: ${messageError.message}`)
    }

    // Process attachments with the attachment handler
    if (payload.attachments && payload.attachments.length > 0) {
      // Convert webhook attachments to EmailMessage format
      const emailMessage = {
        uid: 0, // Not used for webhook processing
        messageId: payload.messageId,
        date: new Date(payload.receivedAt || new Date().toISOString()),
        from: [{ address: payload.from.email, name: payload.from.name }],
        to: payload.to.map(t => ({ address: t.email, name: t.name })),
        cc: payload.cc?.map(c => ({ address: c.email, name: c.name })),
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        attachments: payload.attachments.map(att => ({
          filename: att.filename,
          contentType: att.contentType,
          size: att.size,
          content: att.content ? Buffer.from(att.content, 'base64') : undefined
        })),
        headers: new Map(Object.entries(payload.headers || {}))
      }

      try {
        const uploadedAttachments = await attachmentHandler.processEmailAttachments(
          emailMessage as any,
          ticketRecord.id,
          message.id
        )

        console.log(`Uploaded ${uploadedAttachments.length} attachments for message ${message.id}`)
      } catch (error) {
        console.error('Failed to process attachments:', error)
        // Don't fail the webhook, just log the error
      }
    }

    // Send success response
    res.status(200).json({
      success: true,
      data: {
        ticketId: ticketRecord.id,
        ticketNumber: ticketRecord.number,
        conversationId,
        messageId: message.id,
      }
    })
    return

  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log error to webhook_logs
    await supabase.from('webhook_logs').insert({
      channel_type: 'email',
      payload: req.body,
      headers: req.headers as any,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    // Always return 200 to prevent webhook retries
    res.status(200).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    return
  }
})

// Health check endpoint
router.get('/email/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  })
})

export default router 