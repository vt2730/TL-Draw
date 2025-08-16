// Updated WhiteboardEditor component to use API route
// src/components/whiteboard/whiteboard-editor-api.tsx
'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils, defaultTools } from 'tldraw'
import { Whiteboard, WhiteboardStatus } from '@/types/whiteboard'
import { useRouter } from 'next/navigation'
import 'tldraw/tldraw.css'

interface WhiteboardEditorProps {
  whiteboard: Whiteboard
}

export function WhiteboardEditorAPI({ whiteboard }: WhiteboardEditorProps) {
  const [store] = useState(() => createTLStore({ 
    shapeUtils: defaultShapeUtils, 
    // tools: defaultTools 
  }))
  
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date(whiteboard.updatedAt))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<WhiteboardStatus>(whiteboard.status)
  const [currentName, setCurrentName] = useState(whiteboard.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const router = useRouter()

  // Load initial content
  useEffect(() => {
    if (whiteboard.content) {
      store.loadSnapshot(whiteboard.content)
    }
  }, [store, whiteboard.content])

  // Auto-save using API route
  const saveWhiteboard = useCallback(async (content?: any, name?: string, status?: WhiteboardStatus) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      let snapshot = content || store.getSnapshot()
      
      const response = await fetch(`/api/whiteboards/${whiteboard.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: snapshot,
          ...(name !== undefined && { name }),
          ...(status !== undefined && { status }),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setLastSaved(new Date())
        setHasUnsavedChanges(false)
        if (name !== undefined) setCurrentName(name)
        if (status !== undefined) setCurrentStatus(status)
      } else {
        console.error('Failed to save:', result.error)
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }, [store, whiteboard.id, isSaving])

  // Listen for changes
  useEffect(() => {
    const unsubscribe = store.listen(() => {
      setHasUnsavedChanges(true)
    })

    return unsubscribe
  }, [store])

  // Auto-save every 10 seconds if there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges) return

    const timer = setTimeout(() => {
      saveWhiteboard()
    }, 10000) // 10 seconds

    return () => clearTimeout(timer)
  }, [hasUnsavedChanges, saveWhiteboard])

  const handleManualSave = () => {
    saveWhiteboard()
  }

  const handleStatusChange = (status: WhiteboardStatus) => {
    saveWhiteboard(undefined, undefined, status)
  }

  const handleNameSave = () => {
    if (currentName.trim() && currentName !== whiteboard.name) {
      saveWhiteboard(undefined, currentName.trim())
    }
    setIsEditingName(false)
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Save before leaving?')) {
        saveWhiteboard().then(() => {
          router.push('/whiteboards')
        })
      } else {
        router.push('/whiteboards')
      }
    } else {
      router.push('/whiteboards')
    }
  }

  return (
    <>
      {/* Header - Same as before */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex items-center space-x-2">
            {isEditingName ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={currentName}
                  onChange={(e) => setCurrentName(e.target.value)}
                  className="text-lg font-semibold border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') {
                      setCurrentName(whiteboard.name)
                      setIsEditingName(false)
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleNameSave}
                  className="text-green-600 hover:text-green-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingName(true)}
                className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              >
                {currentName}
              </button>
            )}

            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value as WhiteboardStatus)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {isSaving && (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </div>
            )}
            {!isSaving && hasUnsavedChanges && (
              <span className="text-yellow-600">Unsaved changes</span>
            )}
            {!isSaving && !hasUnsavedChanges && (
              <span>Saved {lastSaved.toLocaleTimeString()}</span>
            )}
          </div>

          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      {/* TLDraw Editor */}
      <div className="flex-1">
        <Tldraw store={store} />
      </div>
    </>
  )
}