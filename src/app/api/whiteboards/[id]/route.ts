import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id } = await params
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content, name, status } = body

    // Verify ownership
    const existingWhiteboard = await prisma.whiteboard.findFirst({
      where: { id, userId },
    })

    if (!existingWhiteboard) {
      return NextResponse.json({ error: 'Whiteboard not found' }, { status: 404 })
    }

    // Update whiteboard
    const updatedWhiteboard = await prisma.whiteboard.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(name !== undefined && { name }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ 
      success: true, 
      data: updatedWhiteboard 
    })
  } catch (error) {
    console.error('API Route Error:', error)
    return NextResponse.json(
      { error: 'Failed to update whiteboard' }, 
      { status: 500 }
    )
  }
}