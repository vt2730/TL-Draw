// src/components/whiteboard/comment-pin.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { updateComment, deleteComment } from '@/lib/actions/comment'
import { format, parseISO } from "date-fns";

export interface CommentData {
    id: string
    text: string
    userName: string
    userAvatar?: string | null
    x: number
    y: number
    resolved: boolean
    createdAt: string
    updatedAt: string
}

interface CommentPinProps {
    comment: CommentData
    isOwner: boolean
    isReadOnly?: boolean
    onUpdate?: (commentId: string, data: { text?: string; resolved?: boolean }) => void
    onDelete?: (commentId: string) => void
}

export function CommentPin({
    comment,
    isOwner,
    isReadOnly = false,
    onUpdate,
    onDelete
}: CommentPinProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(comment.text)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const pinRef = useRef<HTMLDivElement>(null)

    // Close tooltip when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                tooltipRef.current &&
                !tooltipRef.current.contains(event.target as Node) &&
                pinRef.current &&
                !pinRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
                setIsEditing(false)
                setEditText(comment.text)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
            return () => document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen, comment.text])

    const handleSave = async () => {
        if (!editText.trim() || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await updateComment(comment.id, { text: editText.trim() })
            if (result.success) {
                onUpdate?.(comment.id, { text: editText.trim() })
                setIsEditing(false)
            }
        } catch (error) {
            console.error('Failed to update comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleResolve = async () => {
        if (isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await updateComment(comment.id, { resolved: !comment.resolved })
            if (result.success) {
                onUpdate?.(comment.id, { resolved: !comment.resolved })
            }
        } catch (error) {
            console.error('Failed to resolve comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this comment?') || isSubmitting) return

        setIsSubmitting(true)
        try {
            const result = await deleteComment(comment.id)
            if (result.success) {
                onDelete?.(comment.id)
            }
        } catch (error) {
            console.error('Failed to delete comment:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const formatDate = (dateString: string) => {
        const date = parseISO(dateString);
        return format(date, "MMMM d, yyyy h:mm a");
    }
    return (
        <>
            {/* Comment Pin */}
            <div
                ref={pinRef}
                className={`absolute z-10 cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${comment.resolved ? 'opacity-50' : ''
                    }`}
                style={{ left: comment.x, top: comment.y }}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`w-10 h-10 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold ${comment.resolved ? 'bg-green-500' : 'bg-blue-500'
                    } hover:scale-110 transition-transform`}>
                    {comment.resolved ? '✓' : '💬'}
                </div>

                {/* Pin number indicator */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border border-white flex items-center justify-center text-white text-xs font-bold">
                    {comment.id.slice(-2)}
                </div>
            </div>

            {/* Comment Tooltip */}
            {isOpen && (
                <div
                    ref={tooltipRef}
                    className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 max-w-sm"
                    style={{
                        left: Math.min(comment.x + 20, window.innerWidth - 300),
                        top: Math.min(comment.y + 20, window.innerHeight - 200),
                    }}
                >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            {comment.userAvatar ? (
                                <img
                                    src={comment.userAvatar}
                                    alt={comment.userName}
                                    className="w-6 h-6 rounded-full"
                                />
                            ) : (
                                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                                    {comment.userName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div>
                                <div className="font-medium text-sm">{comment.userName}</div>
                                <div className="text-xs text-gray-500">{formatDate(comment.createdAt)}</div>
                            </div>
                        </div>

                        {/* Status indicator */}
                        <div className={`px-2 py-1 rounded-full text-xs ${comment.resolved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {comment.resolved ? 'Resolved' : 'Open'}
                        </div>
                    </div>

                    {/* Comment Content */}
                    <div className="mb-3">
                        {isEditing ? (
                            <div className="space-y-2">
                                <textarea
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded text-sm resize-none"
                                    rows={3}
                                    placeholder="Edit your comment..."
                                    disabled={isSubmitting}
                                />
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false)
                                            setEditText(comment.text)
                                        }}
                                        disabled={isSubmitting}
                                        className="cursor-pointer px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={!editText.trim() || isSubmitting}
                                        className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{comment.text}</p>
                        )}
                    </div>

                    {/* Actions */}
                    {isOwner && !isReadOnly && (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <div className="flex space-x-1">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    disabled={isSubmitting}
                                    className="cursor-pointer px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isSubmitting}
                                    className="cursor-pointer px-2 py-1 text-xs text-red-600 hover:text-red-800"
                                >
                                    Delete
                                </button>
                            </div>

                            <button
                                onClick={handleResolve}
                                disabled={isSubmitting}
                                className={`cursor-pointer px-2 py-1 text-xs rounded ${comment.resolved
                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                    }`}
                            >
                                {isSubmitting ? '...' : comment.resolved ? 'Reopen' : 'Resolve'}
                            </button>
                        </div>
                    )}

                    {/* Close button */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="cursor-pointer absolute -top-2 -right-2 w-6 h-6 bg-gray-500 text-white rounded-full hover:bg-gray-600 flex items-center justify-center text-xs"
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    )
}