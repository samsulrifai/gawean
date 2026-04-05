import { useState, useCallback } from 'react'
import { ChevronRight, MoreHorizontal, Plus, FileText, Trash2, Star, StarOff } from 'lucide-react'
import { usePageStore } from '@/stores/page-store'
import type { Page } from '@/types'
import { cn } from '@/lib/utils'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface PageTreeItemProps {
  page: Page
  depth?: number
}

function PageTreeItem({ page, depth = 0 }: PageTreeItemProps) {
  const {
    activePage,
    setActivePage,
    addPage,
    trashPage,
    toggleFavorite,
    toggleExpanded,
    expandedPages,
    getChildPages,
  } = usePageStore()
  const [isHovered, setIsHovered] = useState(false)

  const children = getChildPages(page.id)
  const hasChildren = children.length > 0
  const isExpanded = expandedPages.has(page.id)
  const isActive = activePage?.id === page.id

  const handleClick = useCallback(() => {
    setActivePage(page)
  }, [page, setActivePage])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleExpanded(page.id)
    },
    [page.id, toggleExpanded]
  )

  const handleAddChild = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      const newPage = addPage(page.id)
      if (!expandedPages.has(page.id)) {
        toggleExpanded(page.id)
      }
      setActivePage(newPage)
    },
    [page.id, addPage, expandedPages, toggleExpanded, setActivePage]
  )

  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            className={cn(
              'group flex items-center gap-0.5 rounded-md px-1.5 py-[5px] text-sm cursor-pointer transition-all duration-150',
              'hover:bg-sidebar-accent',
              isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            )}
            style={{ paddingLeft: `${depth * 12 + 6}px` }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Expand/collapse chevron */}
            <button
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm transition-all duration-150',
                'hover:bg-sidebar-border',
                !hasChildren && 'invisible'
              )}
              onClick={handleToggle}
            >
              <ChevronRight
                className={cn(
                  'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
              />
            </button>

            {/* Page icon */}
            <span className="mr-1 flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">
              {page.icon || '📄'}
            </span>

            {/* Page title */}
            <span className="flex-1 truncate text-sidebar-foreground/80">
              {page.title || 'Untitled'}
            </span>

            {/* Action buttons (visible on hover) */}
            <div
              className={cn(
                'flex items-center gap-0.5 opacity-0 transition-opacity duration-150',
                (isHovered || isActive) && 'opacity-100'
              )}
            >
              <button
                className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-sidebar-border"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                className="flex h-5 w-5 items-center justify-center rounded-sm hover:bg-sidebar-border"
                onClick={handleAddChild}
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={() => toggleFavorite(page.id)}>
            {page.isFavorited ? (
              <>
                <StarOff className="mr-2 h-4 w-4" />
                Remove from Favorites
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                Add to Favorites
              </>
            )}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => {
            const newPage = addPage(page.id)
            if (!expandedPages.has(page.id)) toggleExpanded(page.id)
            setActivePage(newPage)
          }}>
            <FileText className="mr-2 h-4 w-4" />
            Add sub-page
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => trashPage(page.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Move to Trash
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Children (recursive) */}
      {isExpanded && hasChildren && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children.map((child) => (
            <PageTreeItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Empty state for expanded pages with no children */}
      {isExpanded && !hasChildren && (
        <div
          className="px-2 py-1 text-xs text-muted-foreground/60 italic"
          style={{ paddingLeft: `${(depth + 1) * 12 + 24}px` }}
        >
          No pages inside
        </div>
      )}
    </div>
  )
}

export function PageTree() {
  const { getChildPages } = usePageStore()
  const rootPages = getChildPages(null)

  if (rootPages.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        <FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />
        <p>No pages yet</p>
        <p className="text-xs opacity-60">Click + to create your first page</p>
      </div>
    )
  }

  return (
    <div className="space-y-[1px] px-1">
      {rootPages.map((page) => (
        <PageTreeItem key={page.id} page={page} />
      ))}
    </div>
  )
}
