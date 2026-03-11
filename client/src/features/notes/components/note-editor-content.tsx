'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { Heading1, Heading2 } from 'lucide-react';
import { NoteTagsCombobox } from './note-tags-combobox';
import type { NoteEditorData } from '../types';

interface NoteEditorContentProps {
  data: NoteEditorData;
  updateField: <K extends keyof NoteEditorData>(
    field: K,
    value: NoteEditorData[K],
  ) => void;
}

export function NoteEditorContent({
  data,
  updateField,
}: NoteEditorContentProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your note...',
      }),
    ],
    content: data.content || '',
    onUpdate: ({ editor }) => {
      updateField('content', editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[300px] focus:outline-none text-foreground',
      },
    },
  });

  useEffect(() => {
    if (editor && data.content && !editor.isFocused) {
      const currentContent = editor.getHTML();
      if (currentContent !== data.content) {
        editor.commands.setContent(data.content, { emitUpdate: false });
      }
    }
  }, [editor, data.content]);

  return (
    <section className="flex-1 space-y-4">
      <label>
        <span className="sr-only">Title</span>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="Note title..."
          maxLength={255}
          className="w-full bg-transparent text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </label>

      <NoteTagsCombobox
        selectedTags={data.tags}
        onChange={(tags) => updateField('tags', tags)}
      />

      <section>
        <p className="mb-2 text-sm font-medium text-foreground">
          Content
        </p>

        {editor && (
          <nav
            aria-label="Editor toolbar"
            className="mb-2 flex items-center gap-1 border-b border-border pb-2"
          >
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={`rounded p-1.5 transition-colors ${
                editor.isActive('heading', { level: 1 })
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label="Heading 1"
              aria-pressed={editor.isActive('heading', { level: 1 })}
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={`rounded p-1.5 transition-colors ${
                editor.isActive('heading', { level: 2 })
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
              aria-label="Heading 2"
              aria-pressed={editor.isActive('heading', { level: 2 })}
            >
              <Heading2 className="h-4 w-4" />
            </button>
          </nav>
        )}

        <EditorContent editor={editor} />
      </section>
    </section>
  );
}
