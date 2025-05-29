'use client'

import { useState } from 'react'
import { ArrowLeft, Mail, FileText, Signature, Settings } from 'lucide-react'
import { Button } from '@zynlo/ui'
import Link from 'next/link'
import { EmailSignatures } from '@/components/email-signatures'
import { EmailTemplates } from '@/components/email-templates'

type TabType = 'signatures' | 'templates'

export default function EmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('signatures')

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/settings">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Email Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your email signatures and templates
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-w-6xl mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setActiveTab('signatures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'signatures'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Signature className="h-4 w-4" />
            Signatures
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Templates
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg border p-6">
          {activeTab === 'signatures' ? (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Email Signatures</h2>
                <p className="text-sm text-gray-600">
                  Create and manage your email signatures. Your default signature will be automatically 
                  added to new emails.
                </p>
              </div>
              <EmailSignatures />
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Email Templates</h2>
                <p className="text-sm text-gray-600">
                  Create reusable email templates with variables for quick responses. Templates can be 
                  shared with your team or kept private.
                </p>
              </div>
              <EmailTemplates />
            </div>
          )}
        </div>

        {/* Additional Settings Info */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 mb-1">Pro Tips</p>
              <ul className="space-y-1 text-blue-700">
                {activeTab === 'signatures' ? (
                  <>
                    <li>• Use variables like {'{{agent_name}}'} in your signatures for dynamic content</li>
                    <li>• You can have multiple signatures for different situations</li>
                    <li>• HTML formatting is supported for rich signatures</li>
                  </>
                ) : (
                  <>
                    <li>• Templates support variables like {'{{customer_name}}'} and {'{{ticket_number}}'}</li>
                    <li>• Share templates with your team by marking them as public</li>
                    <li>• Use categories to organize templates by type</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 