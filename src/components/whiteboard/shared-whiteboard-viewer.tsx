// src/components/whiteboard/shared-whiteboard-viewer.tsx
'use client'

import { useEffect, useState } from 'react'
import { Tldraw, createTLStore, defaultShapeUtils, defaultTools, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'

interface SharedWhiteboardData {
  id: string
  name: string
  content: any
  createdAt: string
  updatedAt: string
}

interface SharedWhiteboardViewerProps {
  whiteboard: SharedWhiteboardData
}

// Custom component to make the editor read-only
function ReadOnlyWrapper() {
  const editor = useEditor()

  useEffect(() => {
    // Make the editor read-only by disabling user interactions
    editor.updateInstanceState({ isReadonly: true })
    
    // Disable all tools except select and hand
    const currentTool = editor.getCurrentTool()
    if (currentTool?.id !== 'select' && currentTool?.id !== 'hand') {
      editor.setCurrentTool('select')
    }
  }, [editor])

  return null
}

export function SharedWhiteboardViewer({ whiteboard }: SharedWhiteboardViewerProps) {
  const [store] = useState(() => createTLStore({ 
    shapeUtils: defaultShapeUtils, 
  }))

  // Load initial content
  useEffect(() => {
    if (whiteboard.content) {
      store.loadSnapshot(whiteboard.content)
    }
  }, [store, whiteboard.content])

  const formattedDate = new Date(whiteboard.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <h1 className="text-lg font-semibold text-gray-900">{whiteboard.name}</h1>
            </div>
            
            <div className="flex items-center space-x-2 text-sm">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Shared
              </span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Read-Only
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>Last updated: {formattedDate}</span>
          </div>
        </div>
        
        {/* Info banner */}
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            👀 You're viewing a shared whiteboard in read-only mode. 
            You can view and zoom around, but cannot make changes.
          </p>
        </div>
      </div>

      {/* TLDraw Viewer - Read-only mode */}
      <div className="flex-1">
        <Tldraw 
          store={store}
          hideUi={true}
          components={{
            ActionsMenu: null,
            ContextMenu: null,
            QuickActions: null,
            HelpMenu: null,
            ZoomMenu: null,
            MainMenu: null,
          }}
        >
          <ReadOnlyWrapper />
        </Tldraw>
      </div>
    </>
  )
}