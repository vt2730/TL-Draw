// src/lib/actions/comment.ts
'use server'

import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface CreateCommentData {
    whiteboardId: string
    text: string
    x: number
    y: number
}

export interface UpdateCommentData {
    text?: string
    resolved?: boolean
}

export async function createComment(data: CreateCommentData) {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify user has access to the whiteboard
        const whiteboard = await prisma.whiteboard.findFirst({
            where: {
                id: data.whiteboardId,
                userId // Only owner can add comments for now
            },
        })

        if (!whiteboard) {
            return { success: false, error: 'Whiteboard not found or unauthorized' }
        }

        const comment = await prisma.comment.create({
            data: {
                whiteboardId: data.whiteboardId,
                userId,
                userName: user.fullName || user.emailAddresses[0]?.emailAddress || 'Anonymous',
                userEmail: user.emailAddresses[0]?.emailAddress,
                userAvatar: user.imageUrl,
                text: data.text,
                x: data.x,
                y: data.y,
            },
        })

        revalidatePath(`/whiteboards/${data.whiteboardId}`)

        return {
            success: true,
            data: {
                ...comment,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
            },
        }
    } catch (error) {
        console.error('Create comment error:', error)
        return { success: false, error: 'Failed to create comment' }
    }
}

export async function updateComment(commentId: string, data: UpdateCommentData) {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify ownership of the comment
        const existingComment = await prisma.comment.findFirst({
            where: { id: commentId, userId },
        })

        if (!existingComment) {
            return { success: false, error: 'Comment not found or unauthorized' }
        }

        const comment = await prisma.comment.update({
            where: { id: commentId },
            data: {
                ...(data.text !== undefined && { text: data.text }),
                ...(data.resolved !== undefined && { resolved: data.resolved }),
                updatedAt: new Date(),
            },
        })

        revalidatePath(`/whiteboards/${existingComment.whiteboardId}`)

        return {
            success: true,
            data: {
                ...comment,
                createdAt: comment.createdAt.toISOString(),
                updatedAt: comment.updatedAt.toISOString(),
            },
        }
    } catch (error) {
        console.error('Update comment error:', error)
        return { success: false, error: 'Failed to update comment' }
    }
}

export async function deleteComment(commentId: string) {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify ownership of the comment
        const existingComment = await prisma.comment.findFirst({
            where: { id: commentId, userId },
        })

        if (!existingComment) {
            return { success: false, error: 'Comment not found or unauthorized' }
        }

        await prisma.comment.delete({
            where: { id: commentId },
        })

        revalidatePath(`/whiteboards/${existingComment.whiteboardId}`)

        return { success: true }
    } catch (error) {
        console.error('Delete comment error:', error)
        return { success: false, error: 'Failed to delete comment' }
    }
}

export async function getWhiteboardComments(whiteboardId: string, includeResolved: boolean = true) {
    const { userId } = await auth()

    if (!userId) {
        throw new Error('Unauthorized')
    }

    try {
        // Verify user has access to the whiteboard
        const whiteboard = await prisma.whiteboard.findFirst({
            where: {
                id: whiteboardId,
                userId
            },
        })

        if (!whiteboard) {
            return { success: false, error: 'Whiteboard not found or unauthorized' }
        }

        const comments = await prisma.comment.findMany({
            where: {
                whiteboardId,
                ...(includeResolved ? {} : { resolved: false }),
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const serializedComments = comments.map(comment => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
        }))

        return { success: true, data: serializedComments }
    } catch (error) {
        console.error('Get comments error:', error)
        return { success: false, error: 'Failed to fetch comments' }
    }
}

// For shared whiteboards - read-only access to comments
export async function getSharedWhiteboardComments(shareId: string) {
    try {
        const whiteboard = await prisma.whiteboard.findFirst({
            where: {
                shareId,
                isPubliclyShared: true,
                status: 'PUBLISHED'
            },
        })

        if (!whiteboard) {
            return { success: false, error: 'Shared whiteboard not found' }
        }

        const comments = await prisma.comment.findMany({
            where: {
                whiteboardId: whiteboard.id,
                resolved: false, // Only show unresolved comments in shared view
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const serializedComments = comments.map(comment => ({
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString(),
        }))

        return { success: true, data: serializedComments }
    } catch (error) {
        console.error('Get shared comments error:', error)
        return { success: false, error: 'Failed to fetch comments' }
    }
}