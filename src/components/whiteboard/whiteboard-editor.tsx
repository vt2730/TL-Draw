// src/components/whiteboard/whiteboard-editor.tsx
'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils, defaultTools } from 'tldraw'
import { updateWhiteboard } from '@/lib/actions/whiteboard'
import { getWhiteboardComments } from '@/lib/actions/comment'
import { Whiteboard, WhiteboardStatus } from '@/types/whiteboard'
import { useRouter } from 'next/navigation'
import { SharingModal } from './sharing-modal'
import { CommentOverlay } from './comment-overlay'
import type { CommentData } from './comment-pin'
import 'tldraw/tldraw.css'

interface WhiteboardEditorProps {
  whiteboard: Whiteboard
}

export function WhiteboardEditor({ whiteboard }: WhiteboardEditorProps) {
  // Store initialization - tools are handled by Tldraw component, not store
  const [store] = useState(() => createTLStore({
    shapeUtils: defaultShapeUtils,
  }))

  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date(whiteboard.updatedAt))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<WhiteboardStatus>(whiteboard.status)
  const [currentName, setCurrentName] = useState(whiteboard.name)
  const [isEditingName, setIsEditingName] = useState(false)
  const [showSharingModal, setShowSharingModal] = useState(false)
  const [comments, setComments] = useState<CommentData[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Load initial content - Fix: Add delay to ensure store is ready
  useEffect(() => {
    if (whiteboard.content) {
      // Small delay to ensure the store is fully initialized
      setTimeout(() => {
        try {
          store.loadSnapshot(whiteboard.content)
        } catch (error) {
          console.error('Failed to load whiteboard content:', error)
        }
      }, 100)
    }
  }, [store, whiteboard.content])

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const result = await getWhiteboardComments(whiteboard.id, true)
        if (result.success && result.data) {
          setComments(result.data)
        }
      } catch (error) {
        console.error('Failed to load comments:', error)
      } finally {
        setCommentsLoaded(true)
      }
    }

    loadComments()
  }, [whiteboard.id])

  // Auto-save functionality
  const saveWhiteboard = useCallback(async (content?: any, name?: string, status?: WhiteboardStatus) => {
    if (isSaving) return

    setIsSaving(true)
    try {
      let snapshot = content || store.getSnapshot()

      // Clean the snapshot to ensure it's serializable
      const cleanSnapshot = JSON.parse(JSON.stringify(snapshot))

      const result = await updateWhiteboard(whiteboard.id, {
        content: cleanSnapshot,
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
      })

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

  // Listen for changes - Fix: Add cleanup and error handling
  useEffect(() => {
    let unsubscribe: (() => void) | null = null
    
    try {
      unsubscribe = store.listen(() => {
        setHasUnsavedChanges(true)
      })
    } catch (error) {
      console.error('Failed to set up store listener:', error)
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
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

  const handleShare = () => {
    if (currentStatus !== 'PUBLISHED') {
      alert('Only published whiteboards can be shared. Please publish this whiteboard first.')
      return
    }
    setShowSharingModal(true)
  }

  const openCommentsCount = comments.filter(c => !c.resolved).length
  const resolvedCommentsCount = comments.filter(c => c.resolved).length

  return (
    <>
      {/* Header */}
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
              disabled={isPending}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>

            {/* Share indicator */}
            {whiteboard.isPubliclyShared && currentStatus === 'PUBLISHED' && (
              <div className="flex items-center space-x-1 text-green-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>Shared</span>
              </div>
            )}

            {/* Comments indicator */}
            {commentsLoaded && (openCommentsCount > 0 || resolvedCommentsCount > 0) && (
              <div className="flex items-center space-x-1 text-blue-600 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{openCommentsCount} open</span>
                {resolvedCommentsCount > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-600">{resolvedCommentsCount} resolved</span>
                  </>
                )}
              </div>
            )}
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
            onClick={handleShare}
            disabled={currentStatus !== 'PUBLISHED'}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={currentStatus !== 'PUBLISHED' ? 'Publish the whiteboard first to enable sharing' : 'Share this whiteboard'}
          >
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <span>Share</span>
            </div>
          </button>

          <button
            onClick={handleManualSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      {/* TLDraw Editor with Comment Overlay */}
      <div className="flex-1 relative">
        {/* TLDraw Component */}
        <Tldraw 
          store={store}
          autoFocus={false} // Don't auto focus when comment overlay might be active
        />

        {/* Comment Overlay */}
        {commentsLoaded && (
          <CommentOverlay
            whiteboardId={whiteboard.id}
            isOwner={true}
            isReadOnly={false}
            initialComments={comments}
          />
        )}
      </div>

      {/* Sharing Modal */}
      <SharingModal
        whiteboardId={whiteboard.id}
        whiteboardName={currentName}
        currentShareId={whiteboard.shareId ?? null}
        isPubliclyShared={whiteboard.isPubliclyShared || false}
        isOpen={showSharingModal}
        onClose={() => setShowSharingModal(false)}
      />
    </>
  )
}