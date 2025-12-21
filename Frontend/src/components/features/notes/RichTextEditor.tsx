import { memo, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useDebouncedCallback } from 'use-debounce';
import { EditorToolbar } from './EditorToolbar';
import { useSocket } from '@/hooks/socket/useSocket';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  noteId: string;
}

function RichTextEditorComponent({ content, onChange, noteId }: RichTextEditorProps) {
  const { emitOptimized } = useSocket(noteId);

  const handleUpdate = useCallback((html: string) => {
    onChange(html);
    emitOptimized('editNote', { noteId, content: html }, 500);
  }, [onChange, emitOptimized, noteId]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
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
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] px-4 py-8',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      debouncedUpdate(html);
    },
  });

  const debouncedUpdate = useDebouncedCallback(handleUpdate, 500);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}

export const RichTextEditor = memo(RichTextEditorComponent);