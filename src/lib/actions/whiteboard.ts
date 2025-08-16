'use server'

import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { CreateWhiteboardData, UpdateWhiteboardData, WhiteboardStatus } from '@/types/whiteboard'
import { revalidatePath } from 'next/cache'

// Helper function to clean TLDraw snapshots
function cleanTLDrawSnapshot(snapshot: any) {
  if (!snapshot || typeof snapshot !== 'object') return snapshot

  try {
    // Convert to JSON and back to remove any functions or non-serializable data
    const cleaned = JSON.parse(JSON.stringify(snapshot, (key, value) => {
      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        return null
      }
      return value
    }))

    return cleaned
  } catch (error) {
    console.error('Error cleaning snapshot:', error)
    return null
  }
}

export async function createWhiteboard(data: CreateWhiteboardData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const cleanContent = data.content ? cleanTLDrawSnapshot(data.content) : null

    const whiteboard = await prisma.whiteboard.create({
      data: {
        name: data.name,
        status: data.status,
        content: cleanContent,
        userId,
      },
    })

    revalidatePath('/whiteboards')
    return {
      success: true,
      data: {
        ...whiteboard,
        createdAt: whiteboard.createdAt.toISOString(),
        updatedAt: whiteboard.updatedAt.toISOString(),
      },
    }
  } catch (error) {
    console.error('Create whiteboard error:', error)
    return { success: false, error: 'Failed to create whiteboard' }
  }
}

export async function updateWhiteboard(id: string, data: UpdateWhiteboardData) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify ownership
    const existingWhiteboard = await prisma.whiteboard.findFirst({
      where: { id, userId },
    })

    if (!existingWhiteboard) {
      throw new Error('Whiteboard not found or unauthorized')
    }

    // Clean the content if provided
    let updateData: any = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.status !== undefined && { status: data.status }),
      updatedAt: new Date(),
    }

    if (data.content !== undefined) {
      const cleanContent = cleanTLDrawSnapshot(data.content)
      updateData.content = cleanContent
    }

    const whiteboard = await prisma.whiteboard.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/whiteboards')
    revalidatePath(`/whiteboards/${id}`)

    // Return serialized data
    return {
      success: true,
      data: {
        ...whiteboard,
        createdAt: whiteboard.createdAt.toISOString(),
        updatedAt: whiteboard.updatedAt.toISOString(),
      }
    }
  } catch (error) {
    console.error('Update whiteboard error:', error)
    return { success: false, error: 'Failed to update whiteboard' }
  }
}

export async function deleteWhiteboard(id: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    // Verify ownership
    const existingWhiteboard = await prisma.whiteboard.findFirst({
      where: { id, userId },
    })

    if (!existingWhiteboard) {
      throw new Error('Whiteboard not found or unauthorized')
    }

    await prisma.whiteboard.delete({
      where: { id },
    })

    revalidatePath('/whiteboards')
    return { success: true }
  } catch (error) {
    console.error('Delete whiteboard error:', error)
    return { success: false, error: 'Failed to delete whiteboard' }
  }
}

export async function getUserWhiteboards(status?: WhiteboardStatus) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const whiteboards = await prisma.whiteboard.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Serialize dates
    const serializedWhiteboards = whiteboards.map(wb => ({
      ...wb,
      createdAt: wb.createdAt.toISOString(),
      updatedAt: wb.updatedAt.toISOString(),
    }))

    return { success: true, data: serializedWhiteboards }
  } catch (error) {
    console.error('Get whiteboards error:', error)
    return { success: false, error: 'Failed to fetch whiteboards' }
  }
}

export async function getWhiteboardById(id: string) {
  const { userId } = await auth()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  try {
    const whiteboard = await prisma.whiteboard.findFirst({
      where: { id, userId },
    })

    if (!whiteboard) {
      return { success: false, error: 'Whiteboard not found' }
    }

    // Serialize dates
    const serializedWhiteboard = {
      ...whiteboard,
      createdAt: whiteboard.createdAt.toISOString(),
      updatedAt: whiteboard.updatedAt.toISOString(),
    }

    return { success: true, data: serializedWhiteboard }
  } catch (error) {
    console.error('Get whiteboard error:', error)
    return { success: false, error: 'Failed to fetch whiteboard' }
  }
}