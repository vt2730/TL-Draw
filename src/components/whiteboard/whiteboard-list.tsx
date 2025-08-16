// src/components/whiteboard/whiteboard-list.tsx
'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Whiteboard } from '@/types/whiteboard'
import { deleteWhiteboard } from '@/lib/actions/whiteboard'
import { useRouter } from 'next/navigation'

interface WhiteboardListProps {
    whiteboards: Whiteboard[]
}

export function WhiteboardList({ whiteboards }: WhiteboardListProps) {
    const [isPending, startTransition] = useTransition()
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) return

        setDeletingId(id)
        startTransition(() => {
            (async () => {
                try {
                    const result = await deleteWhiteboard(id)
                    if (result.success) {
                        router.refresh()
                    } else {
                        alert(result.error)
                    }
                } catch (err) {
                    console.error('Delete failed:', err)
                    alert('Failed to delete whiteboard')
                } finally {
                    setDeletingId(null)
                }
            })()
        })
    }

    if (whiteboards.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No whiteboards found
                </h3>
                <p className="text-gray-500">
                    Get started by creating your first whiteboard.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whiteboards.map((whiteboard) => (
                <div
                    key={whiteboard.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                    <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-900 truncate flex-1">
                            {whiteboard.name}
                        </h3>
                        <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${whiteboard.status === 'PUBLISHED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                                }`}
                        >
                            {whiteboard.status}
                        </span>
                    </div>

                    <p className="text-sm text-gray-500 mb-4">
                        Updated {formatDistanceToNow(new Date(whiteboard.updatedAt))} ago
                    </p>

                    <div className="flex space-x-2">
                        <Link
                            href={`/whiteboards/${whiteboard.id}`}
                            className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                            Open
                        </Link>
                        <button
                            onClick={() => handleDelete(whiteboard.id, whiteboard.name)}
                            disabled={isPending || deletingId === whiteboard.id}
                            className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            {deletingId === whiteboard.id ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}

