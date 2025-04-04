
import React, { useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const RichTextEditor = ({ initialContent, onChange, readOnly = false }: RichTextEditorProps) => {
  const { theme } = useTheme();
  const quillRef = useRef<ReactQuill>(null);

  // Toolbar configuration
  const modules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{'list': 'ordered'}, {'list': 'bullet'}],
      ['clean']
    ],
    clipboard: {
      // Allow better paste handling
      matchVisual: false,
    },
  };

  // Format options
  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet'
  ];

  // Add custom theme classes
  const editorClass = cn(
    'flex-1 h-full overflow-auto focus:outline-none rounded-md',
    theme === 'dark' 
      ? 'text-white quill-dark' 
      : 'text-black quill-light',
    readOnly ? 'quill-readonly' : ''
  );

  // Handle content change
  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <style>
        {`
        /* Global styles for Quill editor based on theme */
        .quill-dark .ql-toolbar {
          background-color: #2d3748;
          border-color: #4a5568;
        }
        
        .quill-dark .ql-container {
          border-color: #4a5568;
        }
        
        .quill-dark .ql-editor {
          color: white;
        }
        
        .quill-dark .ql-snow .ql-stroke {
          stroke: #e2e8f0;
        }
        
        .quill-dark .ql-snow .ql-fill {
          fill: #e2e8f0;
        }
        
        .quill-readonly .ql-toolbar {
          display: none;
        }
        
        /* Ensure editor takes full height */
        .ql-container {
          height: calc(100% - 42px); /* 42px is the approximate height of the toolbar */
        }
        
        .ql-editor {
          overflow-y: auto;
          min-height: 100%;
          white-space: pre-wrap; /* Preserve whitespace */
        }
        
        .quill-readonly .ql-container {
          height: 100%;
        }
        `}
      </style>
      
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={initialContent}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        className={editorClass}
        preserveWhitespace={true}
      />
    </div>
  );
};

export default RichTextEditor;
