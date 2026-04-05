import { useState, useRef, useCallback, useEffect } from 'react'
import { usePageStore } from '@/stores/page-store'
import { BlockEditor } from '@/components/editor/block-editor'
import { DatabasePageView } from '@/components/database/database-page-view'
import { ImagePlus, MoreHorizontal, Star, StarOff, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const EMOJI_LIST = [
  '📄', '📝', '📋', '📌', '📎', '📐', '📊', '📈',
  '🚀', '🎯', '🎨', '🔧', '⚙️', '🔍', '💡', '💎',
  '🏠', '🏢', '🌍', '🌟', '⭐', '🔥', '💪', '🎉',
  '📚', '📖', '✏️', '🖊️', '📓', '📒', '📕', '📗',
  '✅', '❌', '⚠️', '❓', '💬', '🗂️', '📁', '🗃️',
]

export function PageView() {
  const { activePage, updatePage, toggleFavorite, trashPage } = usePageStore()
  const [isHoveringCover, setIsHoveringCover] = useState(false)
  const [isHoveringHeader, setIsHoveringHeader] = useState(false)
  const titleRef = useRef<HTMLDivElement>(null)

  // Set title content only when activePage changes (not on every keystroke)
  useEffect(() => {
    if (titleRef.current && activePage) {
      const displayTitle = activePage.title === 'Untitled' ? '' : activePage.title
      if (titleRef.current.textContent !== displayTitle) {
        titleRef.current.textContent = displayTitle
      }
    }
  }, [activePage?.id]) // Only on page change, not on title change

  const handleTitleChange = useCallback(() => {
    if (activePage && titleRef.current) {
      updatePage(activePage.id, { title: titleRef.current.textContent || 'Untitled' })
    }
  }, [activePage, updatePage])

  const handleTitleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Move focus to editor
      const editorEl = document.querySelector('.prose-editor') as HTMLElement
      editorEl?.focus()
    }
  }, [])

  const handleSetCover = useCallback(() => {
    if (!activePage) return
    const coverUrls = [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop',
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=400&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&h=400&fit=crop',
    ]
    const random = coverUrls[Math.floor(Math.random() * coverUrls.length)]
    updatePage(activePage.id, { coverImage: random })
  }, [activePage, updatePage])

  if (!activePage) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10">
          <span className="text-4xl">📝</span>
        </div>
        <h2 className="mb-2 text-xl font-semibold text-foreground/80">Welcome to Gawean</h2>
        <p className="text-sm text-muted-foreground/60">
          Select a page from the sidebar or create a new one
        </p>
        <div className="mt-6 flex gap-2 text-xs text-muted-foreground/40">
          <kbd className="rounded border border-border bg-muted/50 px-2 py-1">Ctrl+P</kbd>
          <span className="py-1">to search</span>
          <span className="py-1 text-border">|</span>
          <kbd className="rounded border border-border bg-muted/50 px-2 py-1">Ctrl+\</kbd>
          <span className="py-1">toggle sidebar</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* TOP BAR */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>{activePage.icon}</span>
          <span className="truncate text-foreground/70">{activePage.title}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => toggleFavorite(activePage.id)}
          >
            {activePage.isFavorited ? (
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            ) : (
              <Star className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => toggleFavorite(activePage.id)}>
                {activePage.isFavorited ? (
                  <>
                    <StarOff className="mr-2 h-4 w-4" /> Remove from favorites
                  </>
                ) : (
                  <>
                    <Star className="mr-2 h-4 w-4" /> Add to favorites
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(activePage.id)}>
                <Copy className="mr-2 h-4 w-4" /> Copy link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => trashPage(activePage.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Move to trash
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-full">
          {/* Cover Image */}
          {activePage.coverImage && (
            <div
              className="group relative h-[280px] w-full"
              onMouseEnter={() => setIsHoveringCover(true)}
              onMouseLeave={() => setIsHoveringCover(false)}
            >
              <img
                src={activePage.coverImage}
                alt="Cover"
                className="h-full w-full object-cover"
              />
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent transition-opacity',
                  isHoveringCover ? 'opacity-100' : 'opacity-0'
                )}
              />
              {isHoveringCover && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs shadow-lg"
                    onClick={handleSetCover}
                  >
                    Change cover
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 text-xs shadow-lg"
                    onClick={() => updatePage(activePage.id, { coverImage: null })}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Page Header */}
          <div
            className="px-6 sm:px-10 lg:px-16 xl:px-24 pt-16 pb-2"
            onMouseEnter={() => setIsHoveringHeader(true)}
            onMouseLeave={() => setIsHoveringHeader(false)}
          >
            {/* Header Actions (visible on hover) */}
            <div
              className={cn(
                'mb-3 flex items-center gap-2 transition-opacity duration-150',
                isHoveringHeader || !activePage.coverImage ? 'opacity-100' : 'opacity-0'
              )}
            >
              {!activePage.coverImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  onClick={handleSetCover}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                  Add cover
                </Button>
              )}
            </div>

            {/* Icon + Emoji Picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="mb-2 flex h-[72px] w-[72px] items-center justify-center rounded-xl text-5xl transition-transform hover:scale-110 hover:bg-accent/50">
                  {activePage.icon || '📄'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3" align="start">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Choose an icon</div>
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-accent"
                      onClick={() => updatePage(activePage.id, { icon: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Page Title (editable) */}
            <div
              ref={titleRef}
              contentEditable
              suppressContentEditableWarning
              dir="ltr"
              className="mb-1 text-[40px] font-bold leading-tight text-foreground outline-none [text-align:left] empty:before:text-muted-foreground/40 empty:before:content-['Untitled']"
              onInput={handleTitleChange}
              onKeyDown={handleTitleKeyDown}
              data-placeholder="Untitled"
            />
          </div>

          {/* EDITOR or DATABASE VIEW */}
          {activePage.isDatabase ? (
            <div className="px-0">
              <DatabasePageView databasePage={activePage} />
            </div>
          ) : (
            <div className="px-6 sm:px-10 lg:px-16 xl:px-24 pb-32">
              <BlockEditor />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
