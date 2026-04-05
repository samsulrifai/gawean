import { useState, useMemo, useEffect, useRef } from 'react'
import { usePageStore } from '@/stores/page-store'
import { useUIStore } from '@/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Database, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SearchDialog() {
  const { pages, setActivePage } = usePageStore()
  const { isSearchOpen, toggleSearch } = useUIStore()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredPages = useMemo(
    () =>
      pages
        .filter((p) => !p.isTrashed)
        .filter(
          (p) =>
            p.title.toLowerCase().includes(query.toLowerCase()) ||
            p.icon.includes(query)
        ),
    [pages, query]
  )

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Focus input when dialog opens
  useEffect(() => {
    if (isSearchOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isSearchOpen])

  const handleSelect = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (page) {
      setActivePage(page)
      toggleSearch()
      setQuery('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredPages.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const page = filteredPages[selectedIndex]
      if (page) handleSelect(page.id)
    }
  }

  return (
    <Dialog open={isSearchOpen} onOpenChange={toggleSearch}>
      <DialogContent className="top-[20%] translate-y-0 overflow-hidden rounded-xl p-0 gap-0 sm:max-w-[520px]">
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search for pages in your workspace</DialogDescription>
        </DialogHeader>

        {/* Search Input */}
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Results */}
        <ScrollArea className="max-h-72">
          {filteredPages.length === 0 ? (
            <div className="py-10 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No pages found</p>
              <p className="text-xs text-muted-foreground/60">Try a different search term</p>
            </div>
          ) : (
            <div className="p-1">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Pages
              </div>
              {filteredPages.map((page, index) => (
                <button
                  key={page.id}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50'
                  )}
                  onClick={() => handleSelect(page.id)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {page.isDatabase ? (
                    <Database className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center text-sm">
                      {page.icon}
                    </span>
                  )}
                  <span className="truncate">{page.title}</span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-[11px] text-muted-foreground/50">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
