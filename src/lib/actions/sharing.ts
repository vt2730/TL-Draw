// src/lib/actions/sharing.ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'

export async function generateShareLink(whiteboardId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify ownership and check if whiteboard is published
    const whiteboard = await prisma.whiteboard.findFirst({
      where: { id: whiteboardId, userId },
    })

    if (!whiteboard) {
      return { success: false, error: 'Whiteboard not found or unauthorized' }
    }

    if (whiteboard.status !== 'PUBLISHED') {
      return { success: false, error: 'Only published whiteboards can be shared' }
    }

    // Generate or retrieve share ID
    let shareId = whiteboard.shareId
    if (!shareId) {
      shareId = nanoid(12) // Generate a 12-character unique ID
    }

    const updatedWhiteboard = await prisma.whiteboard.update({
      where: { id: whiteboardId },
      data: {
        shareId,
        isPubliclyShared: true,
      },
    })

    revalidatePath(`/whiteboards/${whiteboardId}`)

    return {
      success: true,
      data: {
        shareId: updatedWhiteboard.shareId,
        shareUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/shared/${updatedWhiteboard.shareId}`,
      },
    }
  } catch (error) {
    console.error('Generate share link error:', error)
    return { success: false, error: 'Failed to generate share link' }
  }
}

export async function disableSharing(whiteboardId: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const whiteboard = await prisma.whiteboard.findFirst({
      where: { id: whiteboardId, userId },
    })

    if (!whiteboard) {
      return { success: false, error: 'Whiteboard not found or unauthorized' }
    }

    await prisma.whiteboard.update({
      where: { id: whiteboardId },
      data: {
        isPubliclyShared: false,
      },
    })

    revalidatePath(`/whiteboards/${whiteboardId}`)
    return { success: true }
  } catch (error) {
    console.error('Disable sharing error:', error)
    return { success: false, error: 'Failed to disable sharing' }
  }
}

export async function getSharedWhiteboard(shareId: string) {
  try {
    const whiteboard = await prisma.whiteboard.findFirst({
      where: { 
        shareId,
        isPubliclyShared: true,
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        name: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    if (!whiteboard) {
      return { success: false, error: 'Shared whiteboard not found or no longer available' }
    }

    return {
      success: true,
      data: {
        ...whiteboard,
        createdAt: whiteboard.createdAt.toISOString(),
        updatedAt: whiteboard.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('Get shared whiteboard error:', error)
    return { success: false, error: 'Failed to fetch shared whiteboard' }
  }
}