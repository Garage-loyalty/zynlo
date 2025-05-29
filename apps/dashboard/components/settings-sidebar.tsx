'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  Users,
  Hash,
  Zap,
  Palette,
  Globe,
  CreditCard,
  Shield,
  Bell,
  Puzzle,
  Code,
  FileText,
  HelpCircle,
  ChevronLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNavigation = [
  {
    title: 'Organisatie',
    items: [
      { id: 'organization', label: 'Organisatie', icon: Building2, href: '/settings/organization' },
      { id: 'teams', label: 'Teams', icon: Users, href: '/settings/teams' },
      { id: 'users', label: 'Gebruikers', icon: Users, href: '/settings/users' },
    ],
  },
  {
    title: 'Kanalen',
    items: [
      { id: 'whatsapp', label: 'WhatsApp Business', icon: Hash, href: '/settings/channels/whatsapp' },
      { id: 'facebook', label: 'Facebook', icon: Hash, href: '/settings/channels/facebook' },
      { id: 'instagram', label: 'Instagram', icon: Hash, href: '/settings/channels/instagram' },
      { id: 'email', label: 'E-mail', icon: Hash, href: '/settings/channels/email' },
      { id: 'livechat', label: 'Live chat', icon: Hash, href: '/settings/channels/livechat' },
      { id: 'telegram', label: 'Telegram', icon: Hash, href: '/settings/channels/telegram' },
      { id: 'sms', label: 'SMS', icon: Hash, href: '/settings/channels/sms' },
    ],
  },
  {
    title: 'Automatisering',
    items: [
      { id: 'rules', label: 'Regels', icon: Zap, href: '/settings/automation/rules' },
      { id: 'flowbots', label: 'Flowbots', icon: Zap, href: '/settings/automation/flowbots' },
      { id: 'ai-journeys', label: 'AI Journeys', icon: Zap, href: '/settings/automation/ai-journeys' },
      { id: 'auto-replies', label: 'Automatische antwoorden', icon: Zap, href: '/settings/automation/auto-replies' },
      { id: 'widget-customization', label: 'Widget aanpassingen', icon: Palette, href: '/settings/widget' },
      { id: 'translations', label: 'Vertalingen', icon: Globe, href: '/settings/translations' },
    ],
  },
  {
    title: 'Instellingen',
    items: [
      { id: 'inbox', label: 'Inbox', icon: Building2, href: '/settings/inbox' },
      { id: 'integrations', label: 'Integraties', icon: Puzzle, href: '/settings/integrations' },
      { id: 'api', label: 'API', icon: Code, href: '/settings/api' },
      { id: 'webhooks', label: 'Webhooks', icon: Code, href: '/settings/webhooks' },
      { id: 'logs', label: 'Logs', icon: FileText, href: '/settings/logs' },
    ],
  },
  {
    title: 'Account',
    items: [
      { id: 'billing', label: 'Facturering', icon: CreditCard, href: '/settings/billing' },
      { id: 'security', label: 'Beveiliging', icon: Shield, href: '/settings/security' },
      { id: 'notifications', label: 'Notificaties', icon: Bell, href: '/settings/notifications' },
    ],
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <Link
          href="/inbox/nieuw"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Terug naar inbox</span>
        </Link>
      </div>

      <nav className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Instellingen</h2>
        
        {settingsNavigation.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
} 