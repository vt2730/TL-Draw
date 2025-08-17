// src/components/whiteboard/comment-overlay.tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CommentPin, CommentData } from './comment-pin'
import { createComment, getWhiteboardComments } from '@/lib/actions/comment'

interface CommentOverlayProps {
  whiteboardId: string
  isOwner: boolean
  isReadOnly?: boolean
  initialComments?: CommentData[]
}

interface NewCommentForm {
  x: number
  y: number
  canvasX: number
  canvasY: number
  text: string
  isVisible: boolean
}

export function CommentOverlay({ 
  whiteboardId, 
  isOwner, 
  isReadOnly = false,
  initialComments = []
}: CommentOverlayProps) {
  const [comments, setComments] = useState<CommentData[]>(initialComments)
  const [newComment, setNewComment] = useState<NewCommentForm>({
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    text: '',
    isVisible: false
  })
  const [isCommentMode, setIsCommentMode] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [viewportState, setViewportState] = useState({ x: 0, y: 0, z: 1 })
  const overlayRef = useRef<HTMLDivElement>(null)

  // Load comments on mount
  useEffect(() => {
    if (isOwner) {
      loadComments()
    }
  }, [whiteboardId, isOwner])

  // Track viewport changes by observing TLDraw container
  useEffect(() => {
    const trackViewport = () => {
      // Try to find the TLDraw canvas element
      const canvas = document.querySelector('.tl-canvas')
      if (canvas) {
        // Get transform from the canvas
        const transform = window.getComputedStyle(canvas).transform
        if (transform && transform !== 'none') {
          // Parse matrix transform to get x, y, z values
          const values = transform.split('(')[1]?.split(')')[0]?.split(',')
          if (values && values.length >= 6) {
            const scaleX = parseFloat(values[0])
            const translateX = parseFloat(values[4])
            const translateY = parseFloat(values[5])
            
            setViewportState({
              x: translateX,
              y: translateY,
              z: scaleX
            })
          }
        }
      }
    }

    // Set up mutation observer to track changes
    const observer = new MutationObserver(() => {
      trackViewport()
    })

    // Start observing
    const canvas = document.querySelector('.tl-canvas')
    if (canvas) {
      observer.observe(canvas, {
        attributes: true,
        attributeFilter: ['style', 'transform']
      })
    }

    // Also track on scroll/resize
    const handleViewportChange = () => trackViewport()
    window.addEventListener('scroll', handleViewportChange)
    window.addEventListener('resize', handleViewportChange)

    // Initial tracking
    trackViewport()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleViewportChange)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [])

  const loadComments = async () => {
    try {
      const result = await getWhiteboardComments(whiteboardId, true)
      if (result.success && result.data) {
        setComments(result.data)
      }
    } catch (error) {
      console.error('Failed to load comments:', error)
    }
  }

  // Handle clicks for comment mode - simplified approach
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (!isCommentMode || isReadOnly || !isOwner) return
    
    // Don't create comment if clicking on the comment form itself
    const target = event.target as Element
    if (target.closest('.comment-form') || target.closest('.comment-pin')) {
      return
    }

    // Stop event propagation
    event.preventDefault()
    event.stopPropagation()
    
    // Get the canvas container for positioning
    const tlEditor = document.querySelector('.tl-editor')
    const canvasContainer = document.querySelector('.tl-canvas') || tlEditor
    
    if (!canvasContainer) return
    
    const rect = canvasContainer.getBoundingClientRect()
    
    // Calculate positions relative to canvas
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const canvasX = (screenX - viewportState.x) / viewportState.z
    const canvasY = (screenY - viewportState.y) / viewportState.z

    // Show comment form at click position
    setNewComment({
      x: event.clientX, // Global screen position for form
      y: event.clientY,
      canvasX,
      canvasY,
      text: '',
      isVisible: true
    })
  }

  // Handle ESC key to exit comment mode
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isCommentMode) {
        setIsCommentMode(false)
        setNewComment({ x: 0, y: 0, canvasX: 0, canvasY: 0, text: '', isVisible: false })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCommentMode])

  const handleSubmitComment = async () => {
    if (!newComment.text.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const result = await createComment({
        whiteboardId,
        text: newComment.text.trim(),
        x: newComment.canvasX,
        y: newComment.canvasY,
      })

      if (result.success && result.data) {
        setComments(prev => [result.data, ...prev])
        setNewComment({ x: 0, y: 0, canvasX: 0, canvasY: 0, text: '', isVisible: false })
        // Exit comment mode after adding comment
        setIsCommentMode(false)
      }
    } catch (error) {
      console.error('Failed to create comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelComment = () => {
    setNewComment({ x: 0, y: 0, canvasX: 0, canvasY: 0, text: '', isVisible: false })
    // Exit comment mode when cancelling
    setIsCommentMode(false)
  }

  const handleUpdateComment = (commentId: string, data: { text?: string; resolved?: boolean }) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, ...data, updatedAt: new Date().toISOString() }
          : comment
      )
    )
  }

  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  // Convert canvas coordinates to screen coordinates for display
  const getScreenCoordinates = (canvasX: number, canvasY: number) => {
    return {
      x: canvasX * viewportState.z + viewportState.x,
      y: canvasY * viewportState.z + viewportState.y
    }
  }

  return (
    <>
      {/* Comment Mode Toggle Button */}
      {isOwner && !isReadOnly && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsCommentMode(!isCommentMode)}
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors ${
              isCommentMode 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
            title={isCommentMode ? 'Exit comment mode' : 'Add comments'}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
          
          {isCommentMode && (
            <div className="absolute bottom-14 right-0 bg-blue-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              Click on canvas to add comment
            </div>
          )}
        </div>
      )}

      {/* REMOVED: The blocking overlay div that was causing the issue */}

      {/* Comment Pins - Fixed pointer events */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="relative w-full h-full">
          {comments.map((comment) => {
            const screenCoords = getScreenCoordinates(comment.x, comment.y)
            return (
              <div 
                key={comment.id}
                className="absolute pointer-events-auto"
                style={{
                  left: screenCoords.x,
                  top: screenCoords.y,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <CommentPin
                  comment={{
                    ...comment,
                    x: 0, // Relative to parent div
                    y: 0
                  }}
                  isOwner={isOwner}
                  isReadOnly={isReadOnly}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* New Comment Form */}
      {newComment.isVisible && (
        <div
          className="comment-form fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 w-72"
          style={{
            left: Math.min(newComment.x + 20, window.innerWidth - 300),
            top: Math.min(newComment.y + 20, window.innerHeight - 150),
          }}
          onClick={(e) => e.stopPropagation()} // Prevent clicks on form from bubbling
        >
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Comment
            </label>
            <textarea
              value={newComment.text}
              onChange={(e) => setNewComment(prev => ({ ...prev, text: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
              rows={3}
              placeholder="Type your comment here..."
              disabled={isSubmitting}
              autoFocus
              onClick={(e) => e.stopPropagation()} // Prevent textarea clicks from bubbling
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancelComment}
              disabled={isSubmitting}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitComment}
              disabled={!newComment.text.trim() || isSubmitting}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments Summary */}
      {comments.length > 0 && (
        <div className="fixed top-4 left-4 z-40 bg-white rounded-lg shadow-lg p-2 text-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>{comments.filter(c => !c.resolved).length} open</span>
            <span className="text-gray-400">•</span>
            <span className="text-green-600">{comments.filter(c => c.resolved).length} resolved</span>
          </div>
        </div>
      )}

      {/* Visual indicator and interaction blocker when in comment mode */}
      {isCommentMode && (
        <>
          {/* Interaction blocker with click handler */}
          <div 
            className="absolute inset-0 z-30 cursor-crosshair"
            style={{ 
              background: 'rgba(59, 130, 246, 0.05)',
              pointerEvents: 'auto'
            }}
            onClick={handleOverlayClick}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
          
          {/* Visual border indicator */}
          <div 
            className="absolute inset-0 pointer-events-none z-31"
            style={{
              border: '2px dashed rgba(59, 130, 246, 0.3)',
              borderRadius: '8px'
            }}
          />
          
          {/* Instructions overlay */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-32 pointer-events-none">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
              Click anywhere to add a comment
              <div className="text-xs mt-1 opacity-80">Press ESC to exit comment mode</div>
            </div>
          </div>
        </>
      )}
    </>
  )
}