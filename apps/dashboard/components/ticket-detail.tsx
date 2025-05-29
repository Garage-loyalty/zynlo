'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Send, 
  Paperclip, 
  MoreVertical,
  Clock,
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Hash,
  Star,
  Archive,
  Trash2,
  UserPlus,
  ChevronDown,
  Loader2,
  X,
  Plus,
  CheckSquare,
  Check,
  Reply,
  ReplyAll,
  Forward
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { MessageContent } from './message-content'
import { 
  useTicket, 
  useSendMessage, 
  useUpdateTicket,
  useDeleteTicket,
  useUsers,
  // useTeams, // Temporarily disabled to prevent team_members table error
  useAuth,
  useTicketLabels,
  useLabels,
  useAssignLabel,
  useRemoveLabel,
  useSendEmailReply,
  useCreateTask,
  type Database,
  useTicketMessages,
  useAgents,
  Message as MessageType,
  Ticket as TicketType,
  Customer as CustomerType,
  SendMessageParams,
  UpdateTicketParams
} from '@zynlo/supabase'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@zynlo/supabase'
import { useSelectedTicketSafe } from '@/hooks/use-selected-ticket'
import { useRouter } from 'next/navigation'
import { Button } from '@zynlo/ui'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { showToast } from './toast'
import { EmailComposer, EmailData } from './email-composer'
import { createClient } from '@supabase/supabase-js'

type TicketStatus = Database['public']['Enums']['ticket_status']
type TicketPriority = Database['public']['Enums']['ticket_priority']

type User = Database['public']['Tables']['users']['Row']
type Label = Database['public']['Tables']['labels']['Row']
type TicketLabel = Database['public']['Tables']['ticket_labels']['Row']

const statusOptions = [
  { value: 'new' as TicketStatus, label: 'Nieuw', icon: AlertCircle, color: 'text-blue-500' },
  { value: 'open' as TicketStatus, label: 'Open', icon: Clock, color: 'text-yellow-500' },
  { value: 'pending' as TicketStatus, label: 'In afwachting', icon: Clock, color: 'text-orange-500' },
  { value: 'resolved' as TicketStatus, label: 'Opgelost', icon: CheckCircle2, color: 'text-green-500' },
  { value: 'closed' as TicketStatus, label: 'Gesloten', icon: XCircle, color: 'text-gray-500' },
]

const priorityOptions = [
  { value: 'low' as TicketPriority, label: 'Laag', color: 'text-gray-500' },
  { value: 'normal' as TicketPriority, label: 'Normaal', color: 'text-blue-500' },
  { value: 'high' as TicketPriority, label: 'Hoog', color: 'text-orange-500' },
  { value: 'urgent' as TicketPriority, label: 'Urgent', color: 'text-red-500' },
]

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const CHANNEL_ICONS = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <Phone className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  twitter: <AtSignIcon className="h-4 w-4" />,
  facebook: <MessageSquare className="h-4 w-4" />,
  instagram: <MessageSquare className="h-4 w-4" />,
  voice: <MicIcon className="h-4 w-4" />,
}

interface TicketDetailProps {
  ticketNumber: number
}

export function TicketDetail({ ticketNumber }: TicketDetailProps) {
  // Use real auth hook to get authenticated user
  const { user } = useAuth()
  const router = useRouter()
  
  const { setSelectedTicketNumber } = useSelectedTicketSafe()
  const { data: ticket, isLoading, error } = useTicket(ticketNumber)
  const { data: users } = useUsers()
  // const { data: teams } = useTeams() // Temporarily disabled
  const { data: allLabels } = useLabels()
  const { data: ticketLabels } = useTicketLabels(ticket?.id || '')
  const assignLabel = useAssignLabel()
  const removeLabel = useRemoveLabel()
  const sendMessage = useSendMessage()
  const updateTicket = useUpdateTicket()
  const deleteTicket = useDeleteTicket()
  const sendEmailReply = useSendEmailReply()
  const createTask = useCreateTask()
  
  // Custom query for ticket tasks
  const { data: ticketTasks } = useQuery({
    queryKey: ['ticket-tasks', ticket?.id],
    queryFn: async () => {
      if (!ticket?.id) return []
      
      try {
        // Simplified query without complex joins
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Error fetching tasks:', error)
          return [] // Return empty array instead of throwing
        }
        
        return data || []
      } catch (err) {
        console.error('Failed to fetch tasks:', err)
        return [] // Return empty array on error
      }
    },
    enabled: !!ticket?.id,
    retry: 1, // Only retry once instead of default 3
    retryDelay: 500, // Wait only 500ms before retry
  })
  
  const [newMessage, setNewMessage] = useState('')
  const [isInternalNote, setIsInternalNote] = useState(false)
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false)
  const [showLabelDropdown, setShowLabelDropdown] = useState(false)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())
  const [showComposer, setShowComposer] = useState(false)
  const [composerMode, setComposerMode] = useState<'reply' | 'reply-all' | 'forward'>('reply')
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Ticket niet gevonden</p>
        </div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return

    // Find the conversation ID
    const conversationId = ticket.conversation?.id
    if (!conversationId) {
      console.error('No conversation found for ticket')
      return
    }

    try {
      if (isInternalNote) {
        // Internal note - only save to database
        await sendMessage.mutateAsync({
          conversationId,
          content: newMessage,
          isInternal: true,
          senderId: user.id,
          senderType: 'agent',
          ticketId: ticket.id
        })
      } else {
        // Send actual email via Edge Function
        console.log('Sending email reply via Edge Function...')
        
        // Get user's full name from users list or use email as fallback
        const currentUser = users?.find((u: any) => u.id === user.id)
        const agentName = currentUser?.full_name || user.email?.split('@')[0] || 'Agent'
        const agentEmail = user.email || 'noreply@helpdesk.com'
        
        const emailResponse = await fetch('/api/send-email-reply', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticketNumber: ticket.number,
            content: newMessage,
            agentName: agentName,
            agentEmail: agentEmail
          })
        })

        const emailResult = await emailResponse.json()

        if (!emailResult.success) {
          throw new Error(emailResult.error || 'Failed to send email')
        }

        console.log('Email sent successfully:', emailResult.messageId)

        // Save the message to database with email metadata
        await sendMessage.mutateAsync({
          conversationId,
          content: `📧 EMAIL SENT: ${newMessage}`,
          isInternal: false,
          senderId: user.id,
          senderType: 'agent',
          ticketId: ticket.id
        })
        
        // The ticket status will be automatically updated to 'resolved' by the hook
      }
      
      setNewMessage('')
      setIsInternalNote(false)
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Er is een onbekende fout opgetreden'
      alert(`Er is een fout opgetreden: ${errorMessage}`)
    }
  }

  const handleUpdateStatus = async (status: TicketStatus) => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: { status }
      })
      setShowStatusDropdown(false)
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleUpdatePriority = async (priority: TicketPriority) => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: { priority }
      })
      setShowPriorityDropdown(false)
    } catch (error) {
      console.error('Error updating priority:', error)
    }
  }

  const handleUpdateAssignee = async (assigneeId: string | null) => {
    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        updates: { assignee_id: assigneeId }
      })
      setShowAssigneeDropdown(false)
    } catch (error) {
      console.error('Error updating assignee:', error)
    }
  }

  const handleToggleLabel = async (labelId: string, labelName: string, isAssigned: boolean) => {
    try {
      if (isAssigned) {
        const ticketLabel = ticketLabels?.find(tl => tl.label_id === labelId)
        if (ticketLabel) {
          await removeLabel.mutateAsync({ ticketId: ticket.id, labelId: ticketLabel.id })
        }
      } else {
        await assignLabel.mutateAsync({ ticketId: ticket.id, labelId })
      }
      setShowLabelDropdown(false)
    } catch (error) {
      console.error('Error toggling label:', error)
    }
  }

  const handleDeleteTicket = async () => {
    if (confirm('Weet je zeker dat je dit ticket wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) {
      try {
        await deleteTicket.mutateAsync(ticket.id)
        // Navigate back to the inbox after deletion
        setSelectedTicketNumber(null)
        router.push('/inbox/nieuw')
      } catch (error) {
        console.error('Error deleting ticket:', error)
        alert('Er is een fout opgetreden bij het verwijderen van het ticket')
      }
    }
  }

  const formatTime = (date: string | Date) => {
    const d = new Date(date)
    return d.toLocaleTimeString('nl-NL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatDate = (date: string | Date) => {
    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) {
      return 'Vandaag'
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Gisteren'
    } else {
      return d.toLocaleDateString('nl-NL', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
    }
  }

  const currentStatus = statusOptions.find(s => s.value === ticket.status)
  const currentPriority = priorityOptions.find(p => p.value === ticket.priority)

  // Sort messages by created_at
  const sortedMessages = [...(ticket.messages || [])].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  // Handle status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!ticket) return

    try {
      await updateTicket.mutateAsync({
        ticketId: ticket.id,
        status: newStatus
      })
      showToast('success', 'Ticket status updated')
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('error', 'Failed to update ticket status')
    }
  }

  // Open email composer
  const openComposer = (mode: 'reply' | 'reply-all' | 'forward', message?: MessageType) => {
    setComposerMode(mode)
    setSelectedMessage(message || null)
    setShowComposer(true)
  }

  // Handle email send
  const handleEmailSend = async (emailData: EmailData) => {
    if (!user || !ticket.conversation?.id) return

    try {
      // Send email via API
      const response = await fetch('/api/send-email-reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketNumber: ticket.number,
          content: emailData.text, // Use plain text for now
          agentName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Agent',
          agentEmail: user.email || 'noreply@helpdesk.com',
          to: emailData.to,
          cc: emailData.cc,
          bcc: emailData.bcc,
          subject: emailData.subject,
          html: emailData.html,
          inReplyTo: emailData.inReplyTo,
          references: emailData.references,
          attachments: emailData.attachments
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to send email')
      }

      // Save the message to database
      await sendMessage.mutateAsync({
        conversationId: ticket.conversation.id,
        content: emailData.html,
        isInternal: false,
        senderId: user.id,
        senderType: 'agent',
        ticketId: ticket.id
      })

      showToast('success', 'Email sent successfully')
      setShowComposer(false)
      setSelectedMessage(null)
    } catch (error) {
      console.error('Failed to send email:', error)
      showToast('error', 'Failed to send email')
    }
  }

  // Handle quick reply
  const handleQuickReply = () => {
    openComposer('reply', sortedMessages[sortedMessages.length - 1])
  }

  return (
    <div className="h-full flex">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="text-base font-medium text-gray-900 break-words">
                  #{ticket.number} - {ticket.subject}
                </div>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Star className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {ticket.customer?.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(ticket.created_at)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Mobile back button */}
              <button 
                onClick={() => setSelectedTicketNumber(null)}
                className="p-2 hover:bg-gray-100 rounded md:hidden"
                title="Terug naar lijst"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded">
                <Archive className="w-4 h-4 text-gray-600" />
              </button>
              <div className="relative">
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
                {showMoreMenu && (
                  <div className="absolute right-0 z-10 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg">
                    <button
                      onClick={() => {
                        handleDeleteTicket()
                        setShowMoreMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      Verwijder ticket
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Metadata Section */}
        <div className="border-b border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-gray-500">Aangemaakt:</span>
                <span className="ml-2 text-gray-900 font-medium">{formatDate(ticket.created_at)}</span>
              </div>
              <div>
                <span className="text-gray-500">Prioriteit:</span>
                <span className={cn("ml-2 font-medium", priorityOptions.find(p => p.value === ticket.priority)?.color)}>
                  {ticket.priority === 'low' && 'Laag'}
                  {ticket.priority === 'normal' && 'Normaal'}
                  {ticket.priority === 'high' && 'Hoog'}
                  {ticket.priority === 'urgent' && 'Urgent'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="ml-2">
                  {currentStatus && (
                    <>
                      <currentStatus.icon className={cn("inline w-4 h-4 mr-1", currentStatus.color)} />
                      <span className="text-gray-900 font-medium">{currentStatus.label}</span>
                    </>
                  )}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Toegewezen aan:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {ticket.assignee ? (
                    `${ticket.assignee.full_name || ticket.assignee.email}`
                  ) : (
                    'Niet toegewezen'
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!ticket.assignee || ticket.assignee.id !== user?.id ? (
                <button
                  onClick={async () => {
                    if (user?.id) {
                      await updateTicket.mutateAsync({
                        ticketId: ticket.id,
                        updates: { assignee_id: user.id }
                      })
                    }
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4 inline mr-1.5" />
                  Aan mij toewijzen
                </button>
              ) : null}
              <div className="relative">
                <button
                  onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50 transition-colors"
                >
                  <User className="w-4 h-4 inline mr-1.5" />
                  Toewijzen
                </button>
                {showAssigneeDropdown && (
                  <div className="absolute right-0 z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        handleUpdateAssignee(null)
                        setShowAssigneeDropdown(false)
                      }}
                      className="w-full px-3 py-2 hover:bg-gray-50 text-left text-sm text-gray-500"
                    >
                      Niet toegewezen
                    </button>
                    {users?.map((u: any) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          handleUpdateAssignee(u.id)
                          setShowAssigneeDropdown(false)
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                      >
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {u.full_name?.charAt(0) || u.email?.charAt(0)}
                        </div>
                        <span className="text-sm">{u.full_name || u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 lg:px-6 py-4 space-y-4">
            {sortedMessages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(message.created_at) !== formatDate(sortedMessages[index - 1].created_at)

              // Get sender info
              let senderName = 'Onbekend'
              let senderInitial = '?'
              
              if (message.sender_type === 'customer') {
                senderName = ticket.customer?.name || 'Klant'
                senderInitial = senderName.charAt(0).toUpperCase()
              } else if (message.sender_type === 'agent') {
                const agent = users?.find(u => u.id === message.sender_id)
                senderName = agent?.full_name || agent?.email || 'Agent'
                senderInitial = senderName.charAt(0).toUpperCase()
              } else if (message.sender_type === 'system') {
                senderName = 'Systeem'
                senderInitial = 'S'
              }

              const isExpanded = expandedMessages.has(message.id)
              const isInternal = message.metadata?.isInternal || false

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDate(message.created_at)}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}
                  <div className={cn(
                    "flex gap-3",
                    message.sender_type === 'agent' && "flex-row-reverse"
                  )}>
                    <div className="flex-shrink-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                        message.sender_type === 'customer' ? "bg-gray-500" : 
                        message.sender_type === 'system' ? "bg-purple-500" : "bg-blue-500"
                      )}>
                        {senderInitial}
                      </div>
                    </div>
                    <div className={cn(
                      "flex-1 max-w-full",
                      message.sender_type === 'agent' && "flex flex-col items-end"
                    )}>
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {senderName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                        {isInternal && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                            Interne notitie
                          </span>
                        )}
                      </div>
                      <div className={cn(
                        "rounded-lg px-4 py-2",
                        message.sender_type === 'customer' 
                          ? "bg-gray-100 text-gray-900" 
                          : message.is_internal
                          ? "bg-yellow-50 text-gray-900 border border-yellow-200"
                          : message.sender_type === 'system'
                          ? "bg-purple-50 text-gray-900 border border-purple-200"
                          : "bg-blue-500 text-white"
                      )}>
                        <MessageContent 
                          content={message.content}
                          contentType={message.content_type}
                          className={cn(
                            "text-sm",
                            message.sender_type === 'agent' && !message.is_internal && "text-white"
                          )}
                          showControls={message.sender_type === 'customer'}
                          safeMode={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer or Quick Reply */}
        {showComposer ? (
          <div className="border-t bg-white">
            <EmailComposer
              mode={composerMode}
              inReplyTo={selectedMessage ? {
                messageId: selectedMessage.metadata?.messageId || selectedMessage.id,
                subject: ticket.subject,
                from: {
                  email: ticket.customer?.email || 'unknown@example.com',
                  name: ticket.customer?.name
                },
                date: new Date(selectedMessage.created_at),
                content: selectedMessage.content,
                references: selectedMessage.metadata?.references
              } : undefined}
              defaultTo={composerMode !== 'compose' && ticket.customer?.email ? [{
                email: ticket.customer.email,
                name: ticket.customer.name
              }] : []}
              defaultSubject={ticket.subject}
              onSend={handleEmailSend}
              onCancel={() => {
                setShowComposer(false)
                setSelectedMessage(null)
              }}
              fromAddress={{
                email: user?.email || 'support@zynlo.com',
                name: user?.user_metadata?.full_name || 'Support Agent'
              }}
              channelId={ticket.channel?.id}
            />
          </div>
        ) : (
          <div className="border-t bg-white p-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleQuickReply}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                Reply to Customer
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsInternalNote(true)}
              >
                <LockIcon className="h-4 w-4 mr-2" />
                Add Internal Note
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-64 border-l border-gray-200 bg-gray-50 p-3 overflow-y-auto">
        {/* Customer Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Klant</h3>
          <div className="bg-white rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                {ticket.customer?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-medium text-gray-900">{ticket.customer?.name || 'Onbekend'}</p>
                <p className="text-sm text-gray-500">{ticket.customer?.email}</p>
              </div>
            </div>
            {ticket.customer?.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{ticket.customer.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Properties */}
        <div className="space-y-4">
          {/* Team */}
          <div>
            <label className="text-sm font-medium text-gray-700">Team</label>
            <div className="mt-1 px-3 py-2 bg-white border border-gray-300 rounded-md">
              <span className="text-sm">{ticket.team?.name || 'Geen team'}</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-700">Labels</label>
            <div className="mt-1">
              <div className="flex flex-wrap gap-2 mb-2">
                {ticketLabels?.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md"
                    style={{ 
                      backgroundColor: `${label.color}20`,
                      color: label.color,
                      border: `1px solid ${label.color}40`
                    }}
                  >
                    <Tag className="w-3 h-3" />
                    {label.name}
                    <button
                      onClick={() => removeLabel.mutate({ 
                        ticketId: ticket.id, 
                        labelId: label.id 
                      })}
                      className="ml-1 hover:bg-black/10 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowLabelDropdown(!showLabelDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-1 border border-gray-300 text-gray-600 text-xs rounded-md hover:bg-gray-50"
                >
                  <Tag className="w-3 h-3" />
                  Label toevoegen
                  <ChevronDown className="w-3 h-3" />
                </button>
                
                {showLabelDropdown && (
                  <div className="absolute z-10 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {allLabels?.map((label: any) => {
                      const isAssigned = ticketLabels?.some(tl => tl.label_id === label.id)
                      return (
                        <button
                          key={label.id}
                          onClick={() => handleToggleLabel(label.id, label.name, isAssigned)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left transition-colors",
                            isAssigned && "bg-blue-50"
                          )}
                        >
                          <div 
                            className="w-4 h-4 rounded" 
                            style={{ backgroundColor: label.color || '#6B7280' }}
                          />
                          <span className="text-sm">{label.name}</span>
                          {isAssigned && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Taken</h3>
              <button
                onClick={() => setShowCreateTask(true)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Toevoegen
              </button>
            </div>
            
            <div className="bg-white rounded-lg p-4">
              {showCreateTask && (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault()
                    if (!newTaskTitle.trim()) return
                    
                    try {
                      await createTask.mutateAsync({
                        title: newTaskTitle,
                        ticket_id: ticket.id,
                        assignee_ids: ticket.assignee_id ? [ticket.assignee_id] : []
                      })
                      setNewTaskTitle('')
                      setShowCreateTask(false)
                    } catch (error) {
                      console.error('Error creating task:', error)
                    }
                  }}
                  className="mb-3 pb-3 border-b border-gray-100"
                >
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Nieuwe taak..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim() || createTask.isPending}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Toevoegen
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewTaskTitle('')
                        setShowCreateTask(false)
                      }}
                      className="px-3 py-1 text-gray-600 text-xs hover:text-gray-800"
                    >
                      Annuleren
                    </button>
                  </div>
                </form>
              )}
              
              <div className="space-y-2">
                {ticketTasks && ticketTasks.length > 0 ? (
                  ticketTasks.map((task: any) => (
                    <div key={task.id} className="flex items-start gap-2">
                      <CheckSquare className={cn(
                        "w-4 h-4 mt-0.5 flex-shrink-0",
                        task.status === 'done' ? "text-green-500" : "text-gray-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm",
                          task.status === 'done' && "line-through text-gray-500"
                        )}>
                          {task.title}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  !showCreateTask && (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Geen taken gekoppeld
                    </p>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 