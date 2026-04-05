import { useState, useCallback, useEffect } from 'react'
import { useDatabaseStore } from '@/stores/database-store'
import type { Page, DatabaseViewType } from '@/types'
import { TableView } from './table-view'
import { BoardView } from './board-view'
import { cn } from '@/lib/utils'
import { Table2, Kanban, LayoutList, Image, Calendar, GanttChart, Plus, Filter, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const VIEW_ICONS: Record<DatabaseViewType, React.ReactNode> = {
  table: <Table2 className="h-3.5 w-3.5" />,
  board: <Kanban className="h-3.5 w-3.5" />,
  list: <LayoutList className="h-3.5 w-3.5" />,
  gallery: <Image className="h-3.5 w-3.5" />,
  calendar: <Calendar className="h-3.5 w-3.5" />,
  timeline: <GanttChart className="h-3.5 w-3.5" />,
}

const VIEW_LABELS: Record<DatabaseViewType, string> = {
  table: 'Table',
  board: 'Board',
  list: 'List',
  gallery: 'Gallery',
  calendar: 'Calendar',
  timeline: 'Timeline',
}

interface DatabasePageViewProps {
  databasePage: Page
}

export function DatabasePageView({ databasePage }: DatabasePageViewProps) {
  const { initDatabase, getViews, addView } = useDatabaseStore()
  const [activeViewType, setActiveViewType] = useState<DatabaseViewType>('table')

  useEffect(() => {
    initDatabase(databasePage.id)
  }, [databasePage.id, initDatabase])

  const _views = getViews(databasePage.id)

  const handleAddView = useCallback(
    (type: DatabaseViewType) => {
      addView(databasePage.id, `${VIEW_LABELS[type]} view`, type)
      setActiveViewType(type)
    },
    [addView, databasePage.id]
  )

  const renderActiveView = () => {
    switch (activeViewType) {
      case 'table':
        return <TableView databasePage={databasePage} />
      case 'board':
        return <BoardView databasePage={databasePage} />
      default:
        return (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            <div className="text-center">
              <div className="mb-2 text-2xl">{VIEW_ICONS[activeViewType]}</div>
              <p>{VIEW_LABELS[activeViewType]} view coming soon</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* View selector toolbar */}
      <div className="flex items-center gap-1 border-b border-border px-4 sm:px-6 lg:px-8 py-1.5">
        {/* View Tabs */}
        <div className="flex items-center gap-0.5">
          {(['table', 'board'] as DatabaseViewType[]).map((type) => (
            <button
              key={type}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm transition-colors',
                activeViewType === type
                  ? 'bg-accent font-medium text-accent-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
              onClick={() => setActiveViewType(type)}
            >
              {VIEW_ICONS[type]}
              {VIEW_LABELS[type]}
            </button>
          ))}

          {/* Add view dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              {(Object.keys(VIEW_LABELS) as DatabaseViewType[]).map((type) => (
                <DropdownMenuItem
                  key={type}
                  onClick={() => handleAddView(type)}
                  className="gap-2"
                >
                  {VIEW_ICONS[type]}
                  {VIEW_LABELS[type]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex-1" />

        {/* Filter & Sort buttons */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
        >
          <Filter className="h-3 w-3" />
          Filter
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground"
        >
          <ArrowUpDown className="h-3 w-3" />
          Sort
        </Button>
      </div>

      {/* Active view */}
      <div className="flex-1 overflow-auto px-2 sm:px-4 lg:px-6 py-2">
        {renderActiveView()}
      </div>
    </div>
  )
}
