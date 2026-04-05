import { usePageStore } from '@/stores/page-store'
import { useUIStore } from '@/stores/ui-store'
import { useCallback, useEffect } from 'react'
import {
  Search,
  Settings,
  Trash2,
  Plus,
  Star,
  Moon,
  Sun,
  ChevronLeft,
  PanelLeft,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import { PageTree } from './page-tree'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export function AppSidebar() {
  const { addPage, setActivePage, getFavoritePages } = usePageStore()
  const {
    isSidebarOpen,
    toggleSidebar,
    isDarkMode,
    toggleDarkMode,
    toggleSearch,
    toggleTrash,
  } = useUIStore()
  const { user, signOut } = useAuthStore()

  const favorites = getFavoritePages()

  const handleNewPage = useCallback(() => {
    const page = addPage(null)
    setActivePage(page)
  }, [addPage, setActivePage])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault()
        toggleSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleSidebar, toggleSearch])

  return (
    <aside
      className={cn(
        'group/sidebar relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out',
        isSidebarOpen ? 'w-[280px] min-w-[280px]' : 'w-0 min-w-0 overflow-hidden border-r-0'
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-12 items-center justify-between px-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-md shadow-violet-500/20">
            G
          </div>
          <span className="font-semibold tracking-tight text-sidebar-foreground">Gawean</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-sidebar-foreground"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Close sidebar <kbd className="ml-1 rounded bg-muted px-1 text-xs">Ctrl+\</kbd></p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Quick Actions */}
      <div className="space-y-0.5 px-2">
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={toggleSearch}
        >
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-auto rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            Ctrl+P
          </kbd>
        </button>
        <button
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          onClick={handleNewPage}
        >
          <Plus className="h-4 w-4" />
          <span>New Page</span>
        </button>
      </div>

      <Separator className="my-2 bg-sidebar-border" />

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="mb-2">
            <div className="mb-1 flex items-center px-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                Favorites
              </span>
            </div>
            <div className="space-y-[1px] px-1">
              {favorites.map((page) => (
                <button
                  key={page.id}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-[5px] text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent"
                  onClick={() => setActivePage(page)}
                >
                  <Star className="h-3.5 w-3.5 text-amber-500/70" />
                  <span className="truncate">{page.icon} {page.title}</span>
                </button>
              ))}
            </div>
            <Separator className="my-2 bg-sidebar-border" />
          </div>
        )}

        {/* Private Pages Section */}
        <div className="mb-2">
          <div className="mb-1 flex items-center justify-between px-3">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Pages
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  onClick={handleNewPage}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Add a page</TooltipContent>
            </Tooltip>
          </div>
          <PageTree />
        </div>
      </ScrollArea>

      {/* Sidebar Footer */}
      <div className="border-t border-sidebar-border p-2">
        <div className="mb-2 flex items-center px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
              Account
            </span>
            <span className="truncate text-xs font-medium text-sidebar-foreground">
              {user?.user_metadata?.full_name || user?.email || 'User'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
                onClick={toggleDarkMode}
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Toggle theme</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
                onClick={toggleTrash}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Trash</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-sidebar-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Settings</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="ml-auto h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Sign Out</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Sidebar toggle when closed */}
      {!isSidebarOpen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed left-2 top-2 z-50 h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={toggleSidebar}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            Open sidebar <kbd className="ml-1 rounded bg-muted px-1 text-xs">Ctrl+\</kbd>
          </TooltipContent>
        </Tooltip>
      )}
    </aside>
  )
}
