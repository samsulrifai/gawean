import { useEffect, useCallback, useMemo } from 'react'
import { usePageStore } from '@/stores/page-store'
import { useDatabaseStore, SELECT_COLORS } from '@/stores/database-store'
import type { Page, SelectOption } from '@/types'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'


interface BoardViewProps {
  databasePage: Page
}

export function BoardView({ databasePage }: BoardViewProps) {
  const { getChildPages, addPage, setActivePage } = usePageStore()
  const { initDatabase, getProperties, getPropertyValue, setPropertyValue } = useDatabaseStore()

  useEffect(() => {
    initDatabase(databasePage.id)
  }, [databasePage.id, initDatabase])

  const properties = getProperties(databasePage.id)
  const rows = getChildPages(databasePage.id)

  // Find the first 'select' property to group by (typically "Status")
  const groupByProperty = properties.find((p) => p.type === 'select')
  const selectOptions: SelectOption[] = groupByProperty?.options?.selectOptions || []

  // Group rows by the select property value
  const groupedRows = useMemo(() => {
    const groups: Record<string, Page[]> = {}
    // Add "No Status" group
    groups['__none__'] = []
    selectOptions.forEach((opt) => {
      groups[opt.label] = []
    })
    rows.forEach((row) => {
      if (groupByProperty) {
        const val = getPropertyValue(row.id, groupByProperty.id) as string | null
        if (val && groups[val]) {
          groups[val].push(row)
        } else {
          groups['__none__'].push(row)
        }
      } else {
        groups['__none__'].push(row)
      }
    })
    return groups
  }, [rows, selectOptions, groupByProperty, getPropertyValue])

  const handleAddCard = useCallback(
    (status: string | null) => {
      const newPage = addPage(databasePage.id)
      if (groupByProperty && status) {
        setPropertyValue(newPage.id, groupByProperty.id, status)
      }
    },
    [addPage, databasePage.id, groupByProperty, setPropertyValue]
  )

  const columns = [
    { label: 'No Status', key: '__none__', color: SELECT_COLORS[0] },
    ...selectOptions.map((opt) => ({
      label: opt.label,
      key: opt.label,
      color: SELECT_COLORS.find((c) => c.name === opt.color) || SELECT_COLORS[0],
    })),
  ]

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-3 p-1 min-w-max">
        {columns.map((column) => {
          const columnRows = groupedRows[column.key] || []
          return (
            <div key={column.key} className="w-[280px] shrink-0">
              {/* Column Header */}
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className={cn('h-2.5 w-2.5 rounded-full', column.color.dot)} />
                  <span className="text-sm font-medium text-foreground/80">
                    {column.label}
                  </span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {columnRows.length}
                  </span>
                </div>
                <button
                  className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                  onClick={() =>
                    handleAddCard(column.key === '__none__' ? null : column.key)
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Cards */}
              <div className="space-y-1.5">
                {columnRows.map((row) => (
                  <button
                    key={row.id}
                    className="w-full rounded-lg border border-border bg-card p-3 text-left shadow-sm transition-all hover:border-border/80 hover:shadow-md"
                    onClick={() => setActivePage(row)}
                  >
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="text-sm">{row.icon}</span>
                      <span className="truncate text-sm font-medium text-foreground">
                        {row.title}
                      </span>
                    </div>
                    {/* Show additional properties */}
                    <div className="flex flex-wrap gap-1">
                      {properties
                        .filter(
                          (p) =>
                            p.id !== groupByProperty?.id && p.name !== 'Name'
                        )
                        .slice(0, 3)
                        .map((prop) => {
                          const val = getPropertyValue(row.id, prop.id)
                          if (!val) return null

                          if (prop.type === 'select') {
                            const opt = prop.options?.selectOptions?.find(
                              (o) => o.label === val
                            )
                            const color =
                              SELECT_COLORS.find((c) => c.name === opt?.color) ||
                              SELECT_COLORS[0]
                            return (
                              <span
                                key={prop.id}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                                  color.bg,
                                  color.text
                                )}
                              >
                                {String(val)}
                              </span>
                            )
                          }
                          return (
                            <span
                              key={prop.id}
                              className="text-[11px] text-muted-foreground"
                            >
                              {String(val)}
                            </span>
                          )
                        })}
                    </div>
                  </button>
                ))}

                {/* Add card button at bottom */}
                <button
                  className="flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground/60 transition-colors hover:border-border hover:bg-accent/30 hover:text-foreground"
                  onClick={() =>
                    handleAddCard(column.key === '__none__' ? null : column.key)
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  New
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
