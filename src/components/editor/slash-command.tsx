import { Extension } from '@tiptap/core'
import Suggestion, { type SuggestionOptions, type SuggestionProps } from '@tiptap/suggestion'
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Minus,
  Code,
  Image,
  AlertCircle,
} from 'lucide-react'


export interface CommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (props: { editor: any; range: any }) => void
}

const getSuggestionItems = (): CommandItem[] => [
  {
    title: 'Text',
    description: 'Just start writing with plain text.',
    icon: <Type className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run()
    },
  },
  {
    title: 'Heading 1',
    description: 'Big section heading.',
    icon: <Heading1 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading.',
    icon: <Heading2 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading.',
    icon: <Heading3 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Create a simple bulleted list.',
    icon: <List className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Create a list with numbering.',
    icon: <ListOrdered className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'To-do List',
    description: 'Track tasks with a to-do list.',
    icon: <CheckSquare className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: 'Quote',
    description: 'Capture a quote.',
    icon: <Quote className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Divider',
    description: 'Visually divide blocks.',
    icon: <Minus className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: 'Code',
    description: 'Capture a code snippet.',
    icon: <Code className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Image',
    description: 'Upload or embed with a link.',
    icon: <Image className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      const url = window.prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    },
  },
  {
    title: 'Callout',
    description: 'Make writing stand out.',
    icon: <AlertCircle className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
]

// Global state to communicate between extension and React component
type SlashCommandState = {
  items: CommandItem[]
  command: (item: CommandItem) => void
  clientRect: (() => DOMRect) | null
  selectedIndex: number
} | null

let _state: SlashCommandState = null
let _setState: ((state: SlashCommandState) => void) | null = null

export function registerSlashCommandState(setter: (state: SlashCommandState) => void) {
  _setState = setter
}

export function unregisterSlashCommandState() {
  _setState = null
}

function updateState(state: SlashCommandState) {
  _state = state
  _setState?.(state)
}

const renderItems = () => {
  return {
    onStart: (props: SuggestionProps) => {
      updateState({
        items: props.items,
        command: props.command,
        clientRect: props.clientRect as (() => DOMRect) | null,
        selectedIndex: 0,
      })
    },

    onUpdate: (props: SuggestionProps) => {
      updateState({
        items: props.items,
        command: props.command,
        clientRect: props.clientRect as (() => DOMRect) | null,
        selectedIndex: _state?.selectedIndex ?? 0,
      })
    },

    onKeyDown: (props: { event: KeyboardEvent }) => {
      if (!_state) return false
      const { items, command } = _state

      if (props.event.key === 'Escape') {
        updateState(null)
        return true
      }
      if (props.event.key === 'ArrowUp') {
        props.event.preventDefault()
        const newIndex = (_state.selectedIndex + items.length - 1) % items.length
        updateState({ ..._state, selectedIndex: newIndex })
        return true
      }
      if (props.event.key === 'ArrowDown') {
        props.event.preventDefault()
        const newIndex = (_state.selectedIndex + 1) % items.length
        updateState({ ..._state, selectedIndex: newIndex })
        return true
      }
      if (props.event.key === 'Enter') {
        props.event.preventDefault()
        const item = items[_state.selectedIndex]
        if (item) {
          command(item)
        }
        return true
      }
      return false
    },

    onExit: () => {
      updateState(null)
    },
  }
}

export const SlashCommand = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        items: ({ query }: { query: string }) => {
          return getSuggestionItems().filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
        command: ({ editor, range, props }: { editor: any; range: any; props: CommandItem }) => {
          props.command({ editor, range })
        },
        render: renderItems,
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
