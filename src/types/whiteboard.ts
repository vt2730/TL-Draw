// src/types/whiteboard.ts - Updated with serialized dates
export type WhiteboardStatus = 'DRAFT' | 'PUBLISHED';

export interface Whiteboard {
  id: string
  name: string
  status: WhiteboardStatus
  content: any // TLDraw snapshot data
  userId: string
  shareId?: string | null
  isPubliclyShared?: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateWhiteboardData {
  name: string;
  status: WhiteboardStatus;
  content?: any;
}

export interface UpdateWhiteboardData {
  name?: string;
  status?: WhiteboardStatus;
  content?: any;
}

// Type for database operations (with Date objects)
export interface WhiteboardDB {
  id: string;
  name: string;
  status: WhiteboardStatus;
  content: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}