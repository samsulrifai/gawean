import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  registerSlashCommandState,
  unregisterSlashCommandState,
  type CommandItem,
} from './slash-command'
import { cn } from '@/lib/utils'

interface SlashState {
  items: CommandItem[]
  command: (item: CommandItem) => void
  clientRect: (() => DOMRect) | null
  selectedIndex: number
}

export function SlashCommandPopup() {
  const [state, setState] = useState<SlashState | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    registerSlashCommandState(setState)
    return () => unregisterSlashCommandState()
  }, [])

  // Auto-scroll
  useEffect(() => {
    if (!scrollRef.current || !state) return
    const el = scrollRef.current.querySelector(
      `[data-idx="${state.selectedIndex}"]`
    ) as HTMLElement
    el?.scrollIntoView({ block: 'nearest' })
  }, [state?.selectedIndex])

  if (!state || state.items.length === 0) return null

  const rect = state.clientRect?.()
  if (!rect) return null

  const pos = {
    top: rect.bottom + 8,
    left: rect.left,
  }

  return createPortal(
    <div
      className="fixed z-[99999] w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-xl shadow-black/20"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        Basic blocks
      </div>
      <div ref={scrollRef} className="max-h-80 overflow-y-auto p-1">
        {state.items.map((item, index) => (
          <div
            key={item.title}
            data-idx={index}
            role="button"
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-100 cursor-pointer select-none',
              index === state.selectedIndex
                ? 'bg-accent text-accent-foreground'
                : 'hover:bg-accent/50'
            )}
            onMouseDown={(e) => {
              e.preventDefault()
              e.stopPropagation()
              state.command(item)
            }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
              {item.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{item.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  )
}
