'use client'

import { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { Button } from '@zynlo/ui'
import { 
  Save, 
  Plus, 
  Trash2, 
  Edit2, 
  Check,
  X,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase
} from 'lucide-react'
import { showToast } from './toast'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@zynlo/supabase'

interface EmailSignature {
  id: string
  name: string
  content: string
  is_default: boolean
  user_id: string
  created_at: string
  updated_at: string
}

interface SignatureEditorProps {
  signature?: EmailSignature
  onSave: (signature: Partial<EmailSignature>) => void
  onCancel: () => void
}

function SignatureEditor({ signature, onSave, onCancel }: SignatureEditorProps) {
  const [name, setName] = useState(signature?.name || '')
  const [isDefault, setIsDefault] = useState(signature?.is_default || false)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
    ],
    content: signature?.content || getDefaultSignatureTemplate(),
  })

  const handleSave = () => {
    if (!name.trim() || !editor) {
      showToast('error', 'Please provide a signature name')
      return
    }

    onSave({
      id: signature?.id,
      name: name.trim(),
      content: editor.getHTML(),
      is_default: isDefault,
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Signature Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Professional, Casual, Support"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Signature Content
        </label>
        <div className="border rounded-md">
          <div className="flex items-center gap-1 p-2 border-b bg-gray-50">
            <button
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={`p-1 rounded ${editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              title="Bold"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={`p-1 rounded ${editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              title="Italic"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded ${editor?.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              title="Underline"
            >
              <u>U</u>
            </button>
            <div className="w-px h-4 bg-gray-300 mx-1" />
            <button
              onClick={() => {
                const url = window.prompt('URL:')
                if (url) {
                  editor?.chain().focus().setLink({ href: url }).run()
                }
              }}
              className={`p-1 rounded ${editor?.isActive('link') ? 'bg-gray-200' : 'hover:bg-gray-200'}`}
              title="Link"
            >
              🔗
            </button>
          </div>
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="default-signature"
          checked={isDefault}
          onChange={(e) => setIsDefault(e.target.checked)}
          className="rounded border-gray-300"
        />
        <label htmlFor="default-signature" className="text-sm text-gray-700">
          Set as default signature
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Save Signature
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export function EmailSignatures() {
  const { user } = useAuth()
  const [signatures, setSignatures] = useState<EmailSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSignature, setEditingSignature] = useState<EmailSignature | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  useEffect(() => {
    if (user) {
      loadSignatures()
    }
  }, [user])

  const loadSignatures = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('email_signatures')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setSignatures(data || [])
    } catch (error) {
      console.error('Failed to load signatures:', error)
      showToast('error', 'Failed to load signatures')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSignature = async (signatureData: Partial<EmailSignature>) => {
    if (!user) return

    try {
      if (signatureData.id) {
        // Update existing
        const { error } = await supabase
          .from('email_signatures')
          .update({
            name: signatureData.name,
            content: signatureData.content,
            is_default: signatureData.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq('id', signatureData.id)

        if (error) throw error

        showToast('success', 'Signature updated')
      } else {
        // Create new
        const { error } = await supabase
          .from('email_signatures')
          .insert({
            name: signatureData.name,
            content: signatureData.content,
            is_default: signatureData.is_default,
            user_id: user.id,
          })

        if (error) throw error

        showToast('success', 'Signature created')
      }

      // If setting as default, unset other defaults
      if (signatureData.is_default) {
        await supabase
          .from('email_signatures')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .neq('id', signatureData.id || '')
      }

      loadSignatures()
      setShowEditor(false)
      setEditingSignature(null)
    } catch (error) {
      console.error('Failed to save signature:', error)
      showToast('error', 'Failed to save signature')
    }
  }

  const handleDeleteSignature = async (id: string) => {
    if (!confirm('Are you sure you want to delete this signature?')) return

    try {
      const { error } = await supabase
        .from('email_signatures')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast('success', 'Signature deleted')
      loadSignatures()
    } catch (error) {
      console.error('Failed to delete signature:', error)
      showToast('error', 'Failed to delete signature')
    }
  }

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
        <h3 className="text-lg font-semibold">Email Signatures</h3>
        {!showEditor && (
          <Button
            onClick={() => {
              setEditingSignature(null)
              setShowEditor(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Signature
          </Button>
        )}
      </div>

      {showEditor ? (
        <div className="bg-white p-4 rounded-lg border">
          <SignatureEditor
            signature={editingSignature || undefined}
            onSave={handleSaveSignature}
            onCancel={() => {
              setShowEditor(false)
              setEditingSignature(null)
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {signatures.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No signatures yet</p>
              <p className="text-sm mt-1">Create your first email signature</p>
            </div>
          ) : (
            signatures.map((signature) => (
              <div
                key={signature.id}
                className="bg-white p-4 rounded-lg border hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{signature.name}</h4>
                      {signature.is_default && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div 
                        dangerouslySetInnerHTML={{ __html: signature.content }}
                        className="prose prose-sm max-w-none line-clamp-3"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingSignature(signature)
                        setShowEditor(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSignature(signature.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function getDefaultSignatureTemplate(): string {
  return `
    <p>Best regards,</p>
    <p><strong>Your Name</strong><br>
    Your Title<br>
    Your Company</p>
    <p>📧 email@example.com<br>
    📱 +1 234 567 8900<br>
    🌐 www.example.com</p>
  `
} 