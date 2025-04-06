
import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Heading1,
  List,
  ListOrdered,
  Save
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const RichTextEditor = ({ initialContent, onChange, readOnly = false }: RichTextEditorProps) => {
  const { theme } = useTheme();
  const [content, setContent] = useState<string>(initialContent);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef<string>(initialContent);
  
  // Simplify the extensions
  const extensions = [
    StarterKit,
    Underline,
    Link.configure({
      openOnClick: true,
      HTMLAttributes: {
        class: 'text-primary underline cursor-pointer',
      },
    }),
  ];
  
  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);
    },
  });

  // Setup autosave (every 3 minutes)
  useEffect(() => {
    if (readOnly) return;
    
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    // Set up new autosave timer (every 3 minutes = 180000ms)
    autoSaveTimerRef.current = setInterval(() => {
      if (editor && lastSavedContentRef.current !== content) {
        lastSavedContentRef.current = content;
        onChange(content);
        console.log("Autosaved editor content");
      }
    }, 180000);
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [editor, content, onChange, readOnly]);

  // Update editor when initial content changes
  useEffect(() => {
    if (!editor) return;
    
    if (editor.getHTML() !== initialContent) {
      editor.commands.setContent(initialContent);
      lastSavedContentRef.current = initialContent;
      setContent(initialContent);
    }
  }, [editor, initialContent]);
  
  // Manual save function
  const handleManualSave = () => {
    if (editor && !readOnly && content !== lastSavedContentRef.current) {
      onChange(content);
      lastSavedContentRef.current = content;
      console.log("Manually saved editor content");
    }
  };

  const editorClass = cn(
    'w-full h-full overflow-auto focus:outline-none rounded-md border border-input p-3',
    'prose prose-sm max-w-none min-h-[200px]',
    theme === 'dark' 
      ? 'prose-invert text-white bg-muted' 
      : 'text-black bg-white'
  );

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!readOnly && (
        <div className="bg-background border-b border-input p-2 mb-3 rounded-t-md flex items-center gap-1 flex-wrap">
          {/* Simpler formatting buttons */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'bg-accent' : ''}
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'bg-accent' : ''}
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'bg-accent' : ''}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'bg-accent' : ''}
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'bg-accent' : ''}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Link button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const url = window.prompt('URL', editor.getAttributes('link').href);
              if (url === null) return;
              if (url === '') {
                editor.chain().focus().unsetLink().run();
                return;
              }
              const fullUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
              editor.chain().focus().setLink({ href: fullUrl }).run();
            }}
            className={editor.isActive('link') ? 'bg-accent' : ''}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          
          <div className="ml-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualSave}
              disabled={readOnly || content === lastSavedContentRef.current}
              className="flex items-center gap-1"
            >
              <Save className="h-4 w-4" />
              <span>Speichern</span>
            </Button>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        <EditorContent editor={editor} className={editorClass} />
      </div>
      
      <style>{`
        /* Editor styles */
        .ProseMirror {
          min-height: 100px;
          height: 100%;
          outline: none;
          word-break: break-word;
        }
        
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        
        .ProseMirror h1 {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0.75rem 0 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
