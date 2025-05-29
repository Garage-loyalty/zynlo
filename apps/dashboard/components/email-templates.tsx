'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { Button } from '@zynlo/ui'
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Copy,
  FileText,
  Tag,
  Variable,
  Eye,
  EyeOff,
  Search,
  Filter
} from 'lucide-react'
import { showToast } from './toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@zynlo/supabase'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: string
  variables: string[]
  is_public: boolean
  user_id: string
  created_at: string
  updated_at: string
}

interface TemplateVariable {
  key: string
  description: string
  example: string
}

const TEMPLATE_CATEGORIES = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'support', label: 'Support' },
  { value: 'notification', label: 'Notification' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'closing', label: 'Closing' },
  { value: 'other', label: 'Other' }
]

const COMMON_VARIABLES: TemplateVariable[] = [
  { key: '{{customer_name}}', description: 'Customer full name', example: 'John Doe' },
  { key: '{{customer_email}}', description: 'Customer email address', example: 'john@example.com' },
  { key: '{{ticket_number}}', description: 'Ticket reference number', example: '#12345' },
  { key: '{{ticket_subject}}', description: 'Ticket subject line', example: 'Help with login' },
  { key: '{{agent_name}}', description: 'Agent full name', example: 'Sarah Smith' },
  { key: '{{agent_email}}', description: 'Agent email address', example: 'sarah@company.com' },
  { key: '{{company_name}}', description: 'Company name', example: 'Zynlo Support' },
  { key: '{{current_date}}', description: 'Current date', example: new Date().toLocaleDateString() },
  { key: '{{current_time}}', description: 'Current time', example: new Date().toLocaleTimeString() }
]

interface TemplateEditorProps {
  template?: EmailTemplate
  onSave: (template: Partial<EmailTemplate>) => void
  onCancel: () => void
}

function TemplateEditor({ template, onSave, onCancel }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '')
  const [subject, setSubject] = useState(template?.subject || '')
  const [category, setCategory] = useState(template?.category || 'support')
  const [isPublic, setIsPublic] = useState(template?.is_public || false)
  const [showVariables, setShowVariables] = useState(true)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Write your email template here... Use {{variable}} for dynamic content.',
      }),
    ],
    content: template?.content || '',
  })

  const insertVariable = (variable: string) => {
    editor?.chain().focus().insertContent(variable).run()
  }

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{\{[\w_]+\}\}/g) || []
    return [...new Set(matches)]
  }

  const handleSave = () => {
    if (!name.trim() || !subject.trim() || !editor) {
      showToast('error', 'Please fill in all required fields')
      return
    }

    const content = editor.getHTML()
    const variables = extractVariables(content + ' ' + subject)

    onSave({
      id: template?.id,
      name: name.trim(),
      subject: subject.trim(),
      content,
      category,
      variables,
      is_public: isPublic,
    })
  }

  const previewTemplate = () => {
    let previewContent = editor?.getHTML() || ''
    let previewSubject = subject

    // Replace variables with examples
    COMMON_VARIABLES.forEach(variable => {
      const regex = new RegExp(variable.key.replace(/[{}]/g, '\\$&'), 'g')
      previewContent = previewContent.replace(regex, `<span class="bg-yellow-100 px-1">${variable.example}</span>`)
      previewSubject = previewSubject.replace(regex, variable.example)
    })

    return { subject: previewSubject, content: previewContent }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Template Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Welcome Email, Support Response"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TEMPLATE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email Subject *
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g., Re: {{ticket_subject}} - Ticket #{{ticket_number}}"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Email Content *
        </label>
        <button
          onClick={() => setShowVariables(!showVariables)}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <Variable className="h-4 w-4" />
          {showVariables ? 'Hide' : 'Show'} Variables
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className={showVariables ? 'col-span-8' : 'col-span-12'}>
          <div className="border rounded-md">
            <EditorContent 
              editor={editor} 
              className="prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none"
            />
          </div>
        </div>

        {showVariables && (
          <div className="col-span-4">
            <div className="border rounded-md p-3 bg-gray-50 h-full overflow-y-auto">
              <h4 className="font-medium text-sm mb-2">Available Variables</h4>
              <div className="space-y-1">
                {COMMON_VARIABLES.map(variable => (
                  <button
                    key={variable.key}
                    onClick={() => insertVariable(variable.key)}
                    className="w-full text-left p-2 hover:bg-white rounded text-sm group"
                  >
                    <div className="font-mono text-blue-600">{variable.key}</div>
                    <div className="text-xs text-gray-500">{variable.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700">
            Make this template available to all team members
          </span>
        </label>
      </div>

      {/* Preview Section */}
      <div className="border rounded-md p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-sm">Preview with Sample Data</h4>
          <Eye className="h-4 w-4 text-gray-500" />
        </div>
        <div className="bg-white rounded p-3 text-sm">
          <div className="font-medium mb-1">Subject: {previewTemplate().subject}</div>
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: previewTemplate().content }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function EmailTemplates() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    if (!user) return

    try {
      let query = supabase
        .from('email_templates')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error

      setTemplates(data || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      showToast('error', 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async (templateData: Partial<EmailTemplate>) => {
    if (!user) return

    try {
      if (templateData.id) {
        // Update existing
        const { error } = await supabase
          .from('email_templates')
          .update({
            name: templateData.name,
            subject: templateData.subject,
            content: templateData.content,
            category: templateData.category,
            variables: templateData.variables,
            is_public: templateData.is_public,
            updated_at: new Date().toISOString(),
          })
          .eq('id', templateData.id)

        if (error) throw error

        showToast('success', 'Template updated')
      } else {
        // Create new
        const { error } = await supabase
          .from('email_templates')
          .insert({
            name: templateData.name,
            subject: templateData.subject,
            content: templateData.content,
            category: templateData.category,
            variables: templateData.variables,
            is_public: templateData.is_public,
            user_id: user.id,
          })

        if (error) throw error

        showToast('success', 'Template created')
      }

      loadTemplates()
      setShowEditor(false)
      setEditingTemplate(null)
    } catch (error) {
      console.error('Failed to save template:', error)
      showToast('error', 'Failed to save template')
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast('success', 'Template deleted')
      loadTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      showToast('error', 'Failed to delete template')
    }
  }

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('email_templates')
        .insert({
          name: `${template.name} (Copy)`,
          subject: template.subject,
          content: template.content,
          category: template.category,
          variables: template.variables,
          is_public: false,
          user_id: user.id,
        })

      if (error) throw error

      showToast('success', 'Template duplicated')
      loadTemplates()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      showToast('error', 'Failed to duplicate template')
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Email Templates</h3>
        {!showEditor && (
          <Button
            onClick={() => {
              setEditingTemplate(null)
              setShowEditor(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {showEditor ? (
        <div className="bg-white p-6 rounded-lg border">
          <TemplateEditor
            template={editingTemplate || undefined}
            onSave={handleSaveTemplate}
            onCancel={() => {
              setShowEditor(false)
              setEditingTemplate(null)
            }}
          />
        </div>
      ) : (
        <>
          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {TEMPLATE_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Templates List */}
          <div className="space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No templates found</p>
                <p className="text-sm mt-1">
                  {searchQuery || selectedCategory ? 'Try adjusting your filters' : 'Create your first email template'}
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-white p-4 rounded-lg border hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          {TEMPLATE_CATEGORIES.find(c => c.value === template.category)?.label || template.category}
                        </span>
                        {template.is_public && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Shared
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                      {template.variables.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Tag className="h-3 w-3 text-gray-400" />
                          {template.variables.map((variable, index) => (
                            <span key={index} className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                              {variable}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateTemplate(template)}
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {template.user_id === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTemplate(template)
                              setShowEditor(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTemplate(template.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
} 