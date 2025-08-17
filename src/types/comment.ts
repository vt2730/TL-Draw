// src/types/comment.ts
export interface Comment {
  id: string
  whiteboardId: string
  userId: string
  userName: string
  userEmail?: string | null
  userAvatar?: string | null
  text: string
  x: number
  y: number
  resolved: boolean
  createdAt: string
  updatedAt: string
}

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