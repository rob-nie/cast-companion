import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Heading from '@tiptap/extension-heading';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Heading3,
  ListOrdered,
  List,
  Strikethrough,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ToggleGroup,
  ToggleGroupItem
} from "@/components/ui/toggle-group";

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const RichTextEditor = ({ initialContent, onChange, readOnly = false }: RichTextEditorProps) => {
  const { theme } = useTheme();
  const [currentContent, setCurrentContent] = useState<string>(initialContent);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const lastJsonContentRef = useRef<any>(null);
  
  // Create and configure the Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We'll configure it separately below
      }),
      Underline,
      TextStyle,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Heading.configure({
        levels: [1, 2, 3],
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const jsonContent = editor.getJSON();
      
      // Skip if content hasn't changed substantially
      // Compare JSON structure instead of HTML for more reliable comparison
      const prevJsonContent = lastJsonContentRef.current;
      if (prevJsonContent && 
          JSON.stringify(jsonContent) === JSON.stringify(prevJsonContent)) {
        return;
      }
      
      // Update reference to latest JSON content
      lastJsonContentRef.current = jsonContent;
      
      // Update local state immediately
      setCurrentContent(html);
      
      // Clear any existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Debounce the parent onChange call (300ms)
      debounceTimerRef.current = setTimeout(() => {
        onChange(html);
      }, 300);
    },
  });
  
  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  // Update editor content when initialContent changes
  useEffect(() => {
    if (!editor) return;

    const currentJson = editor.getJSON();
    const newJson = generateJSON(initialContent || '<p></p>', editor.schema);

    const contentChanged = JSON.stringify(currentJson) !== JSON.stringify(newJson);

    if (contentChanged) {
      lastJsonContentRef.current = newJson;
      editor.commands.setContent(initialContent || '<p></p>');
      setCurrentContent(initialContent || '<p></p>');
    }
  }, [editor, initialContent]);

  const editorClass = cn(
    'w-full h-full overflow-auto focus:outline-none rounded-md border border-input p-3',
    'prose prose-sm max-w-none',
    theme === 'dark' 
      ? 'prose-invert text-white bg-muted' 
      : 'text-black bg-white',
    readOnly ? 'cursor-default' : 'min-h-[200px]'
  );

  // Function to handle link insertion
  const addLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    // cancelled
    if (url === null) return;
    
    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    // add http:// if missing
    const fullUrl = url.startsWith('http://') || url.startsWith('https://') 
      ? url 
      : `https://${url}`;
      
    // Check if the editor version supports the preserveSelection option
    try {
      // For newer Tiptap versions that support preserveSelection
      editor.chain().focus().extendMarkRange('link').setLink({ href: fullUrl }).run();
    } catch (error) {
      // Fallback for older versions
      editor.chain().focus().extendMarkRange('link').setLink({ href: fullUrl }).run();
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!readOnly && (
        <div className="bg-background border-b border-input p-1 mb-3 rounded-t-md flex flex-wrap items-center gap-1">
          <TooltipProvider>
            {/* Text formatting buttons */}
            <ToggleGroup type="multiple" className="flex flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="bold" 
                    aria-label="Toggle bold"
                    data-state={editor.isActive('bold') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    <Bold className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Bold</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="italic" 
                    aria-label="Toggle italic"
                    data-state={editor.isActive('italic') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    <Italic className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Italic</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="underline" 
                    aria-label="Toggle underline"
                    data-state={editor.isActive('underline') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                  >
                    <UnderlineIcon className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Underline</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="strike" 
                    aria-label="Toggle strikethrough"
                    data-state={editor.isActive('strike') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                  >
                    <Strikethrough className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Strikethrough</TooltipContent>
              </Tooltip>
            </ToggleGroup>
          
            <span className="w-px h-6 mx-1 bg-border" />
            
            {/* Headings */}
            <ToggleGroup type="single" className="flex flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="h1" 
                    aria-label="Heading 1"
                    data-state={editor.isActive('heading', { level: 1 }) ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  >
                    <Heading1 className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Heading 1</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="h2" 
                    aria-label="Heading 2"
                    data-state={editor.isActive('heading', { level: 2 }) ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    <Heading2 className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Heading 2</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="h3" 
                    aria-label="Heading 3"
                    data-state={editor.isActive('heading', { level: 3 }) ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    <Heading3 className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Heading 3</TooltipContent>
              </Tooltip>
            </ToggleGroup>
            
            <span className="w-px h-6 mx-1 bg-border" />
            
            {/* Lists */}
            <ToggleGroup type="single" className="flex flex-wrap">
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="bullet" 
                    aria-label="Bullet list"
                    data-state={editor.isActive('bulletList') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                  >
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Bullet List</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <ToggleGroupItem 
                    value="ordered" 
                    aria-label="Ordered list"
                    data-state={editor.isActive('orderedList') ? "on" : "off"}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  >
                    <ListOrdered className="h-4 w-4" />
                  </ToggleGroupItem>
                </TooltipTrigger>
                <TooltipContent>Ordered List</TooltipContent>
              </Tooltip>
            </ToggleGroup>
            
            <span className="w-px h-6 mx-1 bg-border" />
            
            {/* Link */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={cn(
                    "h-8 w-8 p-0", 
                    editor.isActive('link') ? "bg-accent text-accent-foreground" : ""
                  )}
                  onClick={addLink}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Insert Link</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
      
      <div className="flex-1 overflow-auto" ref={editorContainerRef}>
        <EditorContent editor={editor} className={editorClass} />
      </div>
      
      {editor && !readOnly && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ 
            duration: 100,
            theme: theme === 'dark' ? 'dark' : 'light',
          }}
          className={cn(
            "flex rounded-md overflow-hidden border shadow-md p-1",
            theme === 'dark' 
              ? 'bg-popover border-muted' 
              : 'bg-background border-border'
          )}
        >
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-2 h-8", editor.isActive('bold') && "bg-accent")} 
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-2 h-8", editor.isActive('italic') && "bg-accent")} 
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn("px-2 h-8", editor.isActive('link') && "bg-accent")} 
            onClick={addLink}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        </BubbleMenu>
      )}
      
      <style>{`
        /* Fix for bubble menu in dark mode */
        .tippy-box[data-theme~='dark'] {
          background-color: hsl(var(--popover));
          color: hsl(var(--popover-foreground));
        }
        
        /* Additional styles for the editor */
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
          font-size: 1.8rem;
          font-weight: 600;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .ProseMirror h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
