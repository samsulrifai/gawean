import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import ImageExtension from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Dropcursor from '@tiptap/extension-dropcursor'
import { all, createLowlight } from 'lowlight'
import { SlashCommand } from './slash-command'
import { SlashCommandPopup } from './slash-command-list'

const lowlight = createLowlight(all)

interface BlockEditorProps {
  content?: string
  onUpdate?: (content: string) => void
  editable?: boolean
}

export function BlockEditor({ content, onUpdate, editable = true }: BlockEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        dropcursor: false,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }
          return "Type '/' for commands..."
        },
        showOnlyWhenEditable: true,
        showOnlyCurrent: true,
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'task-item',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      ImageExtension.configure({
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editor-link',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Dropcursor.configure({
        color: 'hsl(var(--primary))',
        width: 2,
      }),
      SlashCommand,
    ],
    content: content || '',
    editable,
    editorProps: {
      attributes: {
        class: 'prose-editor outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="block-editor">
      <EditorContent editor={editor} />
      <SlashCommandPopup />
    </div>
  )
}
