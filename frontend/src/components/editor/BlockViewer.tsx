import { useEffect, useMemo } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';

interface BlockViewerProps {
  content: any;
  className?: string;
}

export default function BlockViewer({ content, className = '' }: BlockViewerProps) {
  const editor = useCreateBlockNote({
    initialContent: content,
  });

  // Make editor read-only
  useEffect(() => {
    if (editor) {
      editor.isEditable = false;
    }
  }, [editor]);

  // Update content when it changes
  useEffect(() => {
    if (editor && content) {
      try {
        editor.replaceBlocks(editor.document, content);
      } catch (e) {
        console.error('Failed to update BlockNote content:', e);
      }
    }
  }, [editor, content]);

  return (
    <div className={`blocknote-viewer ${className}`}>
      <BlockNoteView
        editor={editor}
        editable={false}
        theme="light"
        data-theming-css-variables-demo
      />
      <style>{`
        .blocknote-viewer .bn-container {
          background: transparent;
          font-family: inherit;
        }

        .blocknote-viewer .bn-editor {
          padding: 0;
        }

        .blocknote-viewer .bn-block-group {
          padding-left: 0;
        }

        .blocknote-viewer .bn-block-content {
          padding: 4px 0;
        }

        .blocknote-viewer [data-content-type="heading"] h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          color: var(--color-content-primary);
        }

        .blocknote-viewer [data-content-type="heading"] h2 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: var(--color-content-primary);
        }

        .blocknote-viewer [data-content-type="heading"] h3 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.5;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: var(--color-content-primary);
        }

        .blocknote-viewer [data-content-type="paragraph"] {
          color: var(--color-content-secondary);
          line-height: 1.75;
        }

        .blocknote-viewer [data-content-type="bulletListItem"],
        .blocknote-viewer [data-content-type="numberedListItem"] {
          color: var(--color-content-secondary);
          line-height: 1.75;
        }

        .blocknote-viewer [data-content-type="checkListItem"] {
          color: var(--color-content-secondary);
        }

        .blocknote-viewer [data-content-type="codeBlock"] {
          background: var(--color-surface-secondary);
          border-radius: 0.75rem;
          padding: 1rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.875rem;
          overflow-x: auto;
        }

        .blocknote-viewer blockquote {
          border-left: 4px solid var(--color-primary-500);
          padding-left: 1rem;
          margin: 1rem 0;
          color: var(--color-content-tertiary);
          font-style: italic;
        }

        .blocknote-viewer a {
          color: var(--color-primary-500);
          text-decoration: underline;
          text-underline-offset: 2px;
        }

        .blocknote-viewer a:hover {
          color: var(--color-primary-600);
        }

        .blocknote-viewer table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }

        .blocknote-viewer th,
        .blocknote-viewer td {
          border: 1px solid var(--color-border-primary);
          padding: 0.75rem;
          text-align: left;
        }

        .blocknote-viewer th {
          background: var(--color-surface-secondary);
          font-weight: 600;
        }

        .blocknote-viewer hr {
          border: none;
          border-top: 1px solid var(--color-border-primary);
          margin: 2rem 0;
        }

        .blocknote-viewer img {
          max-width: 100%;
          height: auto;
          border-radius: 0.75rem;
          margin: 1rem 0;
        }

        /* Dark mode */
        .dark .blocknote-viewer [data-content-type="heading"] h1,
        .dark .blocknote-viewer [data-content-type="heading"] h2,
        .dark .blocknote-viewer [data-content-type="heading"] h3 {
          color: var(--color-content-primary);
        }

        .dark .blocknote-viewer [data-content-type="paragraph"],
        .dark .blocknote-viewer [data-content-type="bulletListItem"],
        .dark .blocknote-viewer [data-content-type="numberedListItem"] {
          color: var(--color-content-secondary);
        }

        .dark .blocknote-viewer [data-content-type="codeBlock"] {
          background: var(--color-surface-tertiary);
        }
      `}</style>
    </div>
  );
}
