// src/components/whiteboard/sharing-modal.tsx
'use client'

import { useEffect, useState, useTransition } from 'react'
import { generateShareLink, disableSharing } from '@/lib/actions/sharing'

interface SharingModalProps {
    whiteboardId: string
    whiteboardName: string
    currentShareId: string | null
    isPubliclyShared: boolean
    isOpen: boolean
    onClose: () => void
}

export function SharingModal({
    whiteboardId,
    whiteboardName,
    currentShareId,
    isPubliclyShared,
    isOpen,
    onClose,
}: SharingModalProps) {
    const [shareUrl, setShareUrl] = useState<string | null>(null)
    const [isShared, setIsShared] = useState(isPubliclyShared)
    const [copySuccess, setCopySuccess] = useState(false)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (currentShareId && isPubliclyShared) {
            setShareUrl(`${window.location.origin}/shared/${currentShareId}`)
        }
    }, [currentShareId, isPubliclyShared])

    if (!isOpen) return null

    const handleGenerateLink = () => {
        startTransition(async () => {
            const result = await generateShareLink(whiteboardId)
            if (result.success && result.data) {
                setShareUrl(result.data.shareUrl)
                setIsShared(true)
            } else {
                alert(result.error || 'Failed to generate share link')
            }
        })
    }

    const handleDisableSharing = () => {
        startTransition(async () => {
            const result = await disableSharing(whiteboardId)
            if (result.success) {
                setIsShared(false)
                setShareUrl(null)
            } else {
                alert(result.error || 'Failed to disable sharing')
            }
        })
    }

    const handleCopyLink = async () => {
        if (!shareUrl) return

        try {
            await navigator.clipboard.writeText(shareUrl)
            setCopySuccess(true)
            setTimeout(() => setCopySuccess(false), 2000)
        } catch (error) {
            console.error('Failed to copy link:', error)
        }
    }
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Share Whiteboard</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">{whiteboardName}</h3>
                    <p className="text-sm text-gray-600">
                        Share this whiteboard with others. They will be able to view it in read-only mode.
                    </p>
                </div>

                {!isShared ? (
                    <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                Generate a public link to share this whiteboard. Anyone with the link will be able to view it.
                            </p>
                        </div>
                        <button
                            onClick={handleGenerateLink}
                            disabled={isPending}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Generating...' : 'Generate Share Link'}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Share Link</label>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={shareUrl || ''}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                >
                                    {copySuccess ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm text-green-800">
                                🎉 Your whiteboard is now publicly shareable! Anyone with this link can view it.
                            </p>
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={handleDisableSharing}
                                disabled={isPending}
                                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isPending ? 'Disabling...' : 'Disable Sharing'}
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}