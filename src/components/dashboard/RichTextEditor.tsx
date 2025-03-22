
import React, { useRef, useEffect } from 'react';
import { useNotes } from '@/context/NotesContext';
import { useProjects } from '@/context/ProjectContext';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const RichTextEditor = ({ initialContent, onChange, readOnly = false }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Initialize editor with content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent;
    }
  }, [initialContent]);

  const handleInput = () => {
    if (editorRef.current && !readOnly) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Simple formatting actions
  const formatText = (command: string, value: string = '') => {
    if (readOnly) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="flex flex-wrap gap-1 mb-2 p-2 border-b border-border/60 bg-secondary/50 rounded-t-md">
          <button
            onClick={() => formatText('bold')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Bold"
            type="button"
          >
            <span className="font-bold">B</span>
          </button>
          <button
            onClick={() => formatText('italic')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Italic"
            type="button"
          >
            <span className="italic">I</span>
          </button>
          <button
            onClick={() => formatText('underline')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Underline"
            type="button"
          >
            <span className="underline">U</span>
          </button>
          <span className="mx-1 text-border">|</span>
          <button
            onClick={() => formatText('formatBlock', '<h1>')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Heading 1"
            type="button"
          >
            H1
          </button>
          <button
            onClick={() => formatText('formatBlock', '<h2>')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Heading 2"
            type="button"
          >
            H2
          </button>
          <span className="mx-1 text-border">|</span>
          <button
            onClick={() => formatText('insertUnorderedList')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Bullet List"
            type="button"
          >
            • List
          </button>
          <button
            onClick={() => formatText('insertOrderedList')}
            className="p-1.5 rounded hover:bg-secondary/80 focus-ring text-foreground/80"
            title="Numbered List"
            type="button"
          >
            1. List
          </button>
        </div>
      )}
      
      <div 
        ref={editorRef}
        contentEditable={!readOnly}
        onInput={handleInput}
        className={`flex-1 p-4 overflow-auto focus:outline-none ${readOnly ? 'cursor-default' : ''}`}
        style={{ minHeight: '10rem' }}
      />
    </div>
  );
};

export default RichTextEditor;
