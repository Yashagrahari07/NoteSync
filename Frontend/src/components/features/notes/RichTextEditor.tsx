import { memo, useCallback, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useDebouncedCallback } from 'use-debounce';
import { EditorToolbar } from './EditorToolbar';
import { CursorOverlay } from './CursorOverlay';
import { useNoteEditingStore } from '@/stores/noteEditing.store';
import { useAuthStore } from '@/stores/auth.store';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  noteId: string;
}

function RichTextEditorComponent({ content, onChange }: RichTextEditorProps) {
  const previousContentRef = useRef<string>(content);
  const isApplyingRemoteUpdateRef = useRef<boolean>(false);
  const cursorUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { 
    updateContent, 
    emitCursorMove, 
    emitTypingStart,
    cursorPositions,
  } = useNoteEditingStore();
  const storeContent = useNoteEditingStore((state) => state.content);
  const { user } = useAuthStore();

  const handleUpdate = useCallback((html: string) => {
    if (isApplyingRemoteUpdateRef.current) {
      return;
    }
    
    previousContentRef.current = html;
    onChange(html);
    updateContent(html, true);
    emitTypingStart();
  }, [onChange, updateContent, emitTypingStart]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable Link from StarterKit since we configure it separately
        link: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary hover:underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl max-w-none w-full focus:outline-none min-h-[500px] px-4 py-4 leading-[1.4] [&_p]:my-0 [&_p]:leading-[1.4] [&_p]:mb-0 [&_*+p]:mt-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0 [&_li]:leading-[1.4] [&_h1]:my-3 [&_h2]:my-2 [&_h3]:my-2 [&_h1]:leading-[1.2] [&_h2]:leading-[1.3] [&_h3]:leading-[1.3] [&_blockquote]:my-2 [&_pre]:my-2',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(html);
    },
    onSelectionUpdate: ({ editor }) => {
      // Track cursor position
      const position = editor.state.selection.anchor;
      if (position !== undefined) {
        // Throttle cursor updates
        if (cursorUpdateTimerRef.current) {
          clearTimeout(cursorUpdateTimerRef.current);
        }
        cursorUpdateTimerRef.current = setTimeout(() => {
          emitCursorMove(position);
        }, 100);
      }
    },
  });

  const debouncedUpdate = useDebouncedCallback(handleUpdate, 500);

  // Sync editor content when receiving remote updates from other users
  useEffect(() => {
    if (!editor || !storeContent) return;
    
    const currentContent = editor.getHTML();
    if (storeContent !== currentContent && !isApplyingRemoteUpdateRef.current) {
      isApplyingRemoteUpdateRef.current = true;
      
      const currentSelection = editor.state.selection;
      const savedAnchor = currentSelection.anchor;
      const savedHead = currentSelection.head;
      const hasSelection = savedAnchor !== savedHead;
      
      // setContent clears history, which is expected behavior in collaborative editing
      // Users can undo their own local changes, but history clears when remote updates arrive
      editor.commands.setContent(storeContent, { emitUpdate: false });
      
      // Restore cursor position after remote update
      requestAnimationFrame(() => {
        try {
          const docSize = editor.state.doc.content.size;
          if (docSize === 0) {
            isApplyingRemoteUpdateRef.current = false;
            return;
          }
          
          const safeAnchor = Math.min(Math.max(0, savedAnchor), docSize);
          const safeHead = Math.min(Math.max(0, savedHead), docSize);
          
          if (hasSelection && safeAnchor >= 0 && safeHead >= 0) {
            editor.commands.setTextSelection({ from: safeAnchor, to: safeHead });
          } else if (safeAnchor >= 0) {
            editor.commands.setTextSelection(safeAnchor);
          } else {
            editor.commands.setTextSelection(docSize);
          }
        } catch {
          try {
            const docSize = editor.state.doc.content.size;
            if (docSize > 0) {
              editor.commands.setTextSelection(docSize);
            }
          } catch {
            // Ignore restoration errors
          }
        }
        isApplyingRemoteUpdateRef.current = false;
      });
      
      previousContentRef.current = storeContent;
    }
  }, [editor, storeContent]);

  // Initialize editor content on mount
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (currentContent !== content && !isApplyingRemoteUpdateRef.current) {
        isApplyingRemoteUpdateRef.current = true;
        editor.commands.setContent(content, { emitUpdate: false });
        previousContentRef.current = content;
        isApplyingRemoteUpdateRef.current = false;
      }
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="relative">
        <EditorContent editor={editor} />
        {editor && editor.isEditable !== undefined && (
          <CursorOverlay 
            editor={editor} 
            cursorPositions={cursorPositions}
            currentUserId={user?._id}
          />
        )}
      </div>
    </div>
  );
}

export const RichTextEditor = memo(RichTextEditorComponent);