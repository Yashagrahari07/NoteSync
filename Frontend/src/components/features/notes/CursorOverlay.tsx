import { memo, useMemo, type ReactElement } from 'react';
import { Editor } from '@tiptap/react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CursorPosition } from '@/stores/noteEditing.store';

interface CursorOverlayProps {
  editor: Editor | null;
  cursorPositions: Map<string, CursorPosition>;
  currentUserId?: string;
}

// Color palette for different users
const USER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
];

function CursorOverlayComponent({ editor, cursorPositions, currentUserId }: CursorOverlayProps) {
  const cursorElements = useMemo(() => {
    if (!editor || cursorPositions.size === 0) return null;
    
    // TipTap's editor.view getter throws if view isn't ready
    let editorView;
    try {
      editorView = editor.view;
      if (!editorView || typeof editorView.coordsAtPos !== 'function') {
        return null;
      }
    } catch {
      return null;
    }

    const elements: ReactElement[] = [];
    let colorIndex = 0;

    cursorPositions.forEach((cursor, userId) => {
      if (userId === currentUserId?.toString()) return;

      try {
        const position = cursor.position;
        
        let docSize;
        try {
          docSize = editor.state?.doc?.content?.size || 0;
        } catch {
          return;
        }
        
        const safePosition = Math.min(Math.max(0, position), docSize);
        
        let coords;
        try {
          if (!editorView || typeof editorView.coordsAtPos !== 'function') {
            return;
          }
          coords = editorView.coordsAtPos(safePosition);
        } catch {
          return;
        }
        
        if (!coords) return;

        let editorElement;
        try {
          editorElement = editorView.dom;
        } catch {
          return;
        }
        
        const editorContainer = editorElement?.closest('.ProseMirror') || editorElement;
        if (!editorContainer) return;
        
        const containerRect = editorContainer.getBoundingClientRect();
        const relativeLeft = coords.left - containerRect.left;
        // Adjust top position to align with text baseline (move cursor down slightly)
        const relativeTop = coords.top - containerRect.top + 2;

        const color = USER_COLORS[colorIndex % USER_COLORS.length];
        colorIndex++;

        elements.push(
          <TooltipProvider key={userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: `${relativeLeft}px`,
                    top: `${relativeTop}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-5"
                    style={{ backgroundColor: color }}
                  />
                  <Avatar
                    className="absolute -top-6 left-1/2 -translate-x-1/2 h-5 w-5 border-2"
                    style={{ borderColor: color }}
                  >
                    <AvatarFallback
                      className="text-xs"
                      style={{ backgroundColor: color, color: 'white' }}
                    >
                      {cursor.userFullname[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{cursor.userFullname}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      } catch {
        return;
      }
    });

    return elements.length > 0 ? <>{elements}</> : null;
  }, [editor, cursorPositions, currentUserId]);

  if (!cursorElements) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {cursorElements}
    </div>
  );
}

export const CursorOverlay = memo(CursorOverlayComponent);

