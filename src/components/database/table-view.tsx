import { useState, useCallback, useEffect, useMemo } from 'react'
import { usePageStore } from '@/stores/page-store'
import { useDatabaseStore, SELECT_COLORS } from '@/stores/database-store'
import type { Page, Property, FilterConfig, FilterRule, SortRule, CalculationType } from '@/types'
import { cn } from '@/lib/utils'
import {
  Plus, Hash, Type, Calendar, CheckSquare, Search,
  Link2, Mail, Phone, User, Paperclip, CircleDot,
  ArrowUpDown, FunctionSquare, MousePointer2,
  Clock, UserPen, MapPin, ListChecks,
  X, ChevronDown, ChevronRight,
  MoreHorizontal, Eye, EyeOff, GripVertical,
} from 'lucide-react'

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { ColumnHeaderMenu } from './column-header-menu'

// ─── PROPERTY TYPE CONFIG ───

interface PropertyTypeConfig {
  type: Property['type']
  label: string
  icon: React.ReactNode
  category: 'basic' | 'advanced'
}

const PROPERTY_TYPES: PropertyTypeConfig[] = [
  { type: 'text', label: 'Teks', icon: <Type className="h-4 w-4" />, category: 'basic' },
  { type: 'number', label: 'Angka', icon: <Hash className="h-4 w-4" />, category: 'basic' },
  { type: 'select', label: 'Pilih', icon: <CircleDot className="h-4 w-4" />, category: 'basic' },
  { type: 'multi_select', label: 'Multipilih', icon: <ListChecks className="h-4 w-4" />, category: 'basic' },
  { type: 'status', label: 'Status', icon: <CircleDot className="h-4 w-4" />, category: 'basic' },
  { type: 'date', label: 'Tanggal', icon: <Calendar className="h-4 w-4" />, category: 'basic' },
  { type: 'person', label: 'Orang', icon: <User className="h-4 w-4" />, category: 'basic' },
  { type: 'file', label: 'File & media', icon: <Paperclip className="h-4 w-4" />, category: 'basic' },
  { type: 'checkbox', label: 'Kotak centang', icon: <CheckSquare className="h-4 w-4" />, category: 'basic' },
  { type: 'url', label: 'URL', icon: <Link2 className="h-4 w-4" />, category: 'basic' },
  { type: 'phone', label: 'Telepon', icon: <Phone className="h-4 w-4" />, category: 'basic' },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" />, category: 'basic' },
  { type: 'relation', label: 'Relasi', icon: <ArrowUpDown className="h-4 w-4" />, category: 'advanced' },
  { type: 'rollup', label: 'Rollup', icon: <Search className="h-4 w-4" />, category: 'advanced' },
  { type: 'formula', label: 'Formula', icon: <FunctionSquare className="h-4 w-4" />, category: 'advanced' },
  { type: 'button', label: 'Tombol', icon: <MousePointer2 className="h-4 w-4" />, category: 'advanced' },
  { type: 'id_number', label: 'ID', icon: <Hash className="h-4 w-4" />, category: 'advanced' },
  { type: 'location', label: 'Tempat', icon: <MapPin className="h-4 w-4" />, category: 'advanced' },
  { type: 'created_time', label: 'Waktu dibuat', icon: <Clock className="h-4 w-4" />, category: 'advanced' },
  { type: 'last_edited_time', label: 'Waktu terakhir diedit', icon: <Clock className="h-4 w-4" />, category: 'advanced' },
  { type: 'created_by', label: 'Dibuat oleh', icon: <User className="h-4 w-4" />, category: 'advanced' },
  { type: 'last_edited_by', label: 'Terakhir diedit oleh', icon: <UserPen className="h-4 w-4" />, category: 'advanced' },
]

// ─── SELECT CELL ───

interface SelectCellProps {
  property: Property
  value: string | null
  onChange: (value: string) => void
}

function SelectCell({ property, value, onChange }: SelectCellProps) {
  const options = property.options?.selectOptions || []
  const selectedOption = options.find((o) => o.label === value)
  const colorConfig = SELECT_COLORS.find((c) => c.name === selectedOption?.color) || SELECT_COLORS[0]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center px-2 py-1 text-left">
          {value ? (
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', colorConfig.bg, colorConfig.text)}>
              <span className={cn('h-1.5 w-1.5 rounded-full', colorConfig.dot)} />
              {value}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/40">Empty</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <div className="space-y-0.5">
          {options.map((option) => {
            const color = SELECT_COLORS.find((c) => c.name === option.color) || SELECT_COLORS[0]
            return (
              <button
                key={option.id}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                  value === option.label && 'bg-accent'
                )}
                onClick={() => onChange(option.label)}
              >
                <span className={cn('h-2 w-2 rounded-full', color.dot)} />
                {option.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── FILTER / SORT / GROUP / CALC HELPERS ───

function applyFilters(rows: Page[], filterConfig: FilterConfig | null, getPropertyValue: (rowId: string, propId: string) => unknown): Page[] {
  if (!filterConfig || filterConfig.rules.length === 0) return rows

  return rows.filter((row) => {
    const results = filterConfig.rules.map((rule: FilterRule) => {
      const value = getPropertyValue(row.id, rule.propertyId)
      const strValue = value != null ? String(value).toLowerCase() : ''
      const ruleValue = rule.value.toLowerCase()

      switch (rule.operator) {
        case 'contains': return strValue.includes(ruleValue)
        case 'not_contains': return !strValue.includes(ruleValue)
        case 'equals': return strValue === ruleValue
        case 'not_equals': return strValue !== ruleValue
        case 'starts_with': return strValue.startsWith(ruleValue)
        case 'ends_with': return strValue.endsWith(ruleValue)
        case 'is_empty': return !value || strValue === ''
        case 'is_not_empty': return !!value && strValue !== ''
        case 'greater_than': return Number(value) > Number(rule.value)
        case 'less_than': return Number(value) < Number(rule.value)
        case 'greater_or_equal': return Number(value) >= Number(rule.value)
        case 'less_or_equal': return Number(value) <= Number(rule.value)
        case 'is_checked': return value === true
        case 'is_unchecked': return value !== true
        case 'before': return strValue < ruleValue
        case 'after': return strValue > ruleValue
        default: return true
      }
    })

    return filterConfig.conjunction === 'and'
      ? results.every(Boolean)
      : results.some(Boolean)
  })
}

function applySorting(rows: Page[], sortConfig: SortRule[], getPropertyValue: (rowId: string, propId: string) => unknown): Page[] {
  if (sortConfig.length === 0) return rows

  return [...rows].sort((a, b) => {
    for (const rule of sortConfig) {
      const aVal = getPropertyValue(a.id, rule.propertyId)
      const bVal = getPropertyValue(b.id, rule.propertyId)
      const aStr = aVal != null ? String(aVal) : ''
      const bStr = bVal != null ? String(bVal) : ''
      const cmp = aStr.localeCompare(bStr, undefined, { numeric: true })
      if (cmp !== 0) return rule.direction === 'asc' ? cmp : -cmp
    }
    return 0
  })
}

function computeCalculation(
  calcType: CalculationType,
  rows: Page[],
  propertyId: string,
  getPropertyValue: (rowId: string, propId: string) => unknown
): string {
  const values = rows.map((r) => getPropertyValue(r.id, propertyId))
  const total = rows.length

  switch (calcType) {
    case 'count_all': return String(total)
    case 'count_values': return String(values.filter((v) => v != null && v !== '').length)
    case 'count_unique': return String(new Set(values.filter((v) => v != null && v !== '').map(String)).size)
    case 'count_empty': return String(values.filter((v) => v == null || v === '').length)
    case 'count_not_empty': return String(values.filter((v) => v != null && v !== '').length)
    case 'percent_empty': return total > 0 ? `${Math.round((values.filter((v) => v == null || v === '').length / total) * 100)}%` : '0%'
    case 'percent_not_empty': return total > 0 ? `${Math.round((values.filter((v) => v != null && v !== '').length / total) * 100)}%` : '0%'
    case 'sum': {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      return String(nums.reduce((a, b) => a + b, 0))
    }
    case 'average': {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      return nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : '0'
    }
    case 'median': {
      const nums = values.map(Number).filter((n) => !isNaN(n)).sort((a, b) => a - b)
      if (nums.length === 0) return '0'
      const mid = Math.floor(nums.length / 2)
      return nums.length % 2 ? String(nums[mid]) : ((nums[mid - 1] + nums[mid]) / 2).toFixed(2)
    }
    case 'min': {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      return nums.length > 0 ? String(Math.min(...nums)) : '-'
    }
    case 'max': {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      return nums.length > 0 ? String(Math.max(...nums)) : '-'
    }
    case 'range': {
      const nums = values.map(Number).filter((n) => !isNaN(n))
      return nums.length > 0 ? String(Math.max(...nums) - Math.min(...nums)) : '-'
    }
    default: return ''
  }
}

// ─── FILTER BAR COMPONENT ───

function FilterBar({ databaseId }: { databaseId: string }) {
  const store = useDatabaseStore()
  const filterConfig = store.getFilterConfig(databaseId)
  const properties = store.getProperties(databaseId)

  if (!filterConfig || filterConfig.rules.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2 bg-muted/20">
      <span className="text-xs text-muted-foreground">Filter</span>
      {filterConfig.rules.map((rule: FilterRule, idx: number) => {
        const prop = properties.find((p) => p.id === rule.propertyId)
        return (
          <div
            key={rule.id}
            className="flex items-center gap-1 rounded-md bg-accent/50 px-2 py-1 text-xs"
          >
            {idx > 0 && (
              <button
                className="mr-1 text-muted-foreground hover:text-foreground text-[10px] uppercase"
                onClick={() => {
                  const current = filterConfig.conjunction
                  store.setFilterConfig(databaseId, {
                    ...filterConfig,
                    conjunction: current === 'and' ? 'or' : 'and',
                  })
                }}
              >
                {filterConfig.conjunction === 'and' ? 'DAN' : 'ATAU'}
              </button>
            )}
            <span className="font-medium text-foreground">{prop?.name || 'Unknown'}</span>
            <select
              className="bg-transparent text-muted-foreground outline-none text-xs"
              value={rule.operator}
              onChange={(e) =>
                store.updateFilterRule(databaseId, rule.id, { operator: e.target.value as FilterRule['operator'] })
              }
            >
              <option value="contains">mengandung</option>
              <option value="not_contains">tidak mengandung</option>
              <option value="equals">sama dengan</option>
              <option value="not_equals">tidak sama dengan</option>
              <option value="is_empty">kosong</option>
              <option value="is_not_empty">tidak kosong</option>
              <option value="starts_with">diawali</option>
              <option value="ends_with">diakhiri</option>
            </select>
            {!['is_empty', 'is_not_empty', 'is_checked', 'is_unchecked'].includes(rule.operator) && (
              <input
                className="w-24 bg-transparent border-b border-border text-foreground outline-none text-xs px-1"
                value={rule.value}
                placeholder="nilai..."
                onChange={(e) =>
                  store.updateFilterRule(databaseId, rule.id, { value: e.target.value })
                }
              />
            )}
            <button
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => store.removeFilterRule(databaseId, rule.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── SORT BAR ───

function SortBar({ databaseId }: { databaseId: string }) {
  const store = useDatabaseStore()
  const sortConfig = store.getSortConfig(databaseId)
  const properties = store.getProperties(databaseId)

  if (sortConfig.length === 0) return null

  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2 bg-muted/20">
      <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Urutan</span>
      {sortConfig.map((rule: SortRule) => {
        const prop = properties.find((p) => p.id === rule.propertyId)
        return (
          <div
            key={rule.propertyId}
            className="flex items-center gap-1 rounded-md bg-accent/50 px-2 py-1 text-xs"
          >
            <span className="font-medium text-foreground">{prop?.name}</span>
            <span className="text-muted-foreground">
              {rule.direction === 'asc' ? '↑ Naik' : '↓ Turun'}
            </span>
            <button
              className="ml-1 text-muted-foreground hover:text-foreground"
              onClick={() => store.removeSortRule(databaseId, rule.propertyId)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── TABLE VIEW ───

interface TableViewProps {
  databasePage: Page
}

export function TableView({ databasePage }: TableViewProps) {
  const { getChildPages, addPage, setActivePage } = usePageStore()
  const store = useDatabaseStore()
  const { initDatabase, getVisibleProperties, getPropertyValue, setPropertyValue, addProperty } = store

  const [editingCell, setEditingCell] = useState<{ rowId: string; propId: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newPropName, setNewPropName] = useState('')
  const [showNewProp, setShowNewProp] = useState(false)
  const [typeSearchQuery, setTypeSearchQuery] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showPropVisibility, setShowPropVisibility] = useState(false)
  const [propSearchQuery, setPropSearchQuery] = useState('')

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(rowId)) next.delete(rowId)
      else next.add(rowId)
      return next
    })
  }

  useEffect(() => {
    initDatabase(databasePage.id)
  }, [databasePage.id, initDatabase])

  const properties = getVisibleProperties(databasePage.id)
  const allRows = getChildPages(databasePage.id)
  const filterConfig = store.getFilterConfig(databasePage.id)
  const sortConfig = store.getSortConfig(databasePage.id)
  const groupByPropertyId = store.getGroupBy(databasePage.id)
  const calculations = store.getCalculations(databasePage.id)

  // Apply filter → sort
  const processedRows = useMemo(() => {
    let rows = applyFilters(allRows, filterConfig, getPropertyValue)
    rows = applySorting(rows, sortConfig, getPropertyValue)
    return rows
  }, [allRows, filterConfig, sortConfig, getPropertyValue])

  // Group rows if groupBy is set
  const groupedRows = useMemo(() => {
    if (!groupByPropertyId) return null
    const groups = new Map<string, Page[]>()
    for (const row of processedRows) {
      const val = getPropertyValue(row.id, groupByPropertyId)
      const key = val != null && val !== '' ? String(val) : '(Kosong)'
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    }
    return groups
  }, [processedRows, groupByPropertyId, getPropertyValue])

  const handleAddRow = useCallback(() => {
    const newPage = addPage(databasePage.id)
    const allProps = store.getProperties(databasePage.id)
    const nameProperty = allProps.find((p) => p.name === 'Name')
    if (nameProperty) {
      setPropertyValue(newPage.id, nameProperty.id, 'Untitled')
    }
  }, [addPage, databasePage.id, store, setPropertyValue])

  const handleAddSubItem = useCallback((parentRowId: string) => {
    const newPage = addPage(parentRowId)
    const allProps = store.getProperties(databasePage.id)
    const nameProperty = allProps.find((p) => p.name === 'Name')
    if (nameProperty) {
      setPropertyValue(newPage.id, nameProperty.id, 'Untitled')
    }
    // Auto-expand parent
    setExpandedRows((prev) => new Set(prev).add(parentRowId))
  }, [addPage, databasePage.id, store, setPropertyValue])

  const handleAddProperty = useCallback(
    (type: Property['type'] = 'text') => {
      const allProps = store.getProperties(databasePage.id)
      const typeConfig = PROPERTY_TYPES.find((pt) => pt.type === type)
      const name = newPropName.trim() || typeConfig?.label || `Column ${allProps.length + 1}`
      addProperty(databasePage.id, name, type)
      setNewPropName('')
      setTypeSearchQuery('')
      setShowNewProp(false)
    },
    [addProperty, databasePage.id, newPropName, store]
  )

  const startEditing = (rowId: string, propId: string) => {
    const current = getPropertyValue(rowId, propId)
    setEditValue(typeof current === 'string' ? current : current != null ? String(current) : '')
    setEditingCell({ rowId, propId })
  }

  const finishEditing = () => {
    if (editingCell) {
      const allProps = store.getProperties(databasePage.id)
      const prop = allProps.find((p) => p.id === editingCell.propId)
      let finalValue: unknown = editValue
      if (prop?.type === 'number') {
        finalValue = editValue === '' ? null : Number(editValue)
      } else if (prop?.type === 'checkbox') {
        finalValue = editValue === 'true'
      }
      setPropertyValue(editingCell.rowId, editingCell.propId, finalValue)
      setEditingCell(null)
    }
  }

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  // ─── Name cell with expand/collapse toggle ───
  const renderNameCell = (row: Page, depth: number) => {
    const children = getChildPages(row.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedRows.has(row.id)
    const indent = depth * 20

    return (
      <div className="group/name flex h-full w-full items-center" style={{ paddingLeft: `${indent + 4}px` }}>
        {/* Toggle arrow — always clickable, visible on hover or when has children/expanded */}
        <button
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-sm transition-all',
            hasChildren || isExpanded
              ? 'text-muted-foreground hover:bg-accent hover:text-foreground'
              : 'text-transparent group-hover/name:text-muted-foreground/40 hover:!bg-accent hover:!text-foreground'
          )}
          onClick={(e) => {
            e.stopPropagation()
            toggleRowExpanded(row.id)
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>
        {/* Page icon + title */}
        <button
          className="flex flex-1 items-center gap-1.5 px-1 py-1 text-left text-sm font-medium text-foreground hover:underline truncate"
          onClick={() => setActivePage(row)}
        >
          <span className="text-base shrink-0">{row.icon}</span>
          <span className="truncate">{row.title}</span>
        </button>
      </div>
    )
  }

  const renderCell = (row: Page, property: Property, depth: number = 0) => {
    const value = getPropertyValue(row.id, property.id)
    const isEditing = editingCell?.rowId === row.id && editingCell?.propId === property.id

    // Name column — use special expandable cell
    if (property.name === 'Name' && property.position === 0) {
      return renderNameCell(row, depth)
    }

    // Select
    if (property.type === 'select' || property.type === 'status') {
      return (
        <SelectCell
          property={property}
          value={value as string | null}
          onChange={(val) => setPropertyValue(row.id, property.id, val)}
        />
      )
    }

    // Checkbox
    if (property.type === 'checkbox') {
      return (
        <div className="flex h-full items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => setPropertyValue(row.id, property.id, e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-border accent-violet-500"
          />
        </div>
      )
    }

    // Date
    if (property.type === 'date') {
      return isEditing ? (
        <input
          type="date"
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={finishEditing}
          onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
          className="h-full w-full bg-transparent px-2 py-1 text-sm outline-none"
        />
      ) : (
        <button
          className="flex h-full w-full items-center px-2 py-1 text-left text-sm"
          onClick={() => startEditing(row.id, property.id)}
        >
          {value ? (
            <span className="text-foreground/80">{String(value)}</span>
          ) : (
            <span className="text-muted-foreground/40">Empty</span>
          )}
        </button>
      )
    }

    // Default text/number
    return isEditing ? (
      <input
        autoFocus
        type={property.type === 'number' ? 'number' : 'text'}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={finishEditing}
        onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
        className="h-full w-full bg-transparent px-2 py-1 text-sm outline-none"
      />
    ) : (
      <button
        className="flex h-full w-full items-center px-2 py-1 text-left text-sm"
        onClick={() => startEditing(row.id, property.id)}
      >
        {value != null && value !== '' ? (
          <span className="text-foreground/80 truncate">{String(value)}</span>
        ) : (
          <span className="text-muted-foreground/40">Empty</span>
        )}
      </button>
    )
  }

  const hasCalculations = calculations.length > 0

  // ─── Recursive row rendering with sub-items ───
  const renderRowWithChildren = (row: Page, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedRows.has(row.id)
    const children = getChildPages(row.id)

    return (
      <div key={row.id}>
        {/* Main row */}
        <div className="group flex border-b border-border transition-colors hover:bg-muted/20">
          {properties.map((property) => (
            <div
              key={property.id}
              className={cn(
                'h-9 w-[200px] shrink-0 border-r border-border',
                property.isFrozen && 'sticky left-0 z-10 bg-background',
                property.wrapContent && 'h-auto min-h-[36px]'
              )}
              style={property.wrapContent ? { whiteSpace: 'normal' } : { whiteSpace: 'nowrap' }}
            >
              {renderCell(row, property, depth)}
            </div>
          ))}
          <div className="h-9 w-[40px] shrink-0" />
        </div>

        {/* Expanded children + add sub-item */}
        {isExpanded && (
          <>
            {children.map((child) => renderRowWithChildren(child, depth + 1))}
            {/* Add sub-item button */}
            <div className="flex border-b border-border">
              <div
                className="flex h-8 w-[200px] shrink-0 items-center border-r border-border"
                style={{ paddingLeft: `${(depth + 1) * 20 + 4 + 20}px` }}
              >
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                  onClick={() => handleAddSubItem(row.id)}
                >
                  <Plus className="h-3 w-3" />
                  <span>Sub-item baru</span>
                </button>
              </div>
              {properties.slice(1).map((property) => (
                <div key={property.id} className="h-8 w-[200px] shrink-0 border-r border-border" />
              ))}
              <div className="h-8 w-[40px] shrink-0" />
            </div>
          </>
        )}
      </div>
    )
  }

  const renderRows = (rows: Page[]) =>
    rows.map((row) => renderRowWithChildren(row, 0))

  return (
    <div className="w-full">
      {/* Filter & Sort bars */}
      <FilterBar databaseId={databasePage.id} />
      <SortBar databaseId={databasePage.id} />

      <div className="w-full overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b border-border bg-muted/30">
            {properties.map((property) => (
              <div
                key={property.id}
                className={cn(
                  'h-8 w-[200px] shrink-0 border-r border-border',
                  property.isFrozen && 'sticky left-0 z-10 bg-muted/30'
                )}
              >
                <ColumnHeaderMenu
                  property={property}
                  databaseId={databasePage.id}
                />
              </div>
            ))}
            {/* Add property column */}
            <div className="flex h-8 w-[40px] shrink-0 items-center justify-center border-r border-border">
              <Popover open={showNewProp} onOpenChange={(open) => {
                setShowNewProp(open)
                if (!open) {
                  setTypeSearchQuery('')
                  setNewPropName('')
                }
              }}>
                <PopoverTrigger asChild>
                  <button className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start" side="bottom" sideOffset={4}>
                  <div className="border-b border-border p-2">
                    <Input
                      placeholder="Nama properti"
                      value={newPropName}
                      onChange={(e) => setNewPropName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddProperty('text')}
                      className="h-8 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="border-b border-border p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        placeholder="Pilih jenis"
                        value={typeSearchQuery}
                        onChange={(e) => setTypeSearchQuery(e.target.value)}
                        className="h-8 pl-7 text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-[280px] overflow-y-auto overscroll-contain p-1.5">
                    {(() => {
                      const query = typeSearchQuery.toLowerCase()
                      const basicTypes = PROPERTY_TYPES.filter(
                        (pt) => pt.category === 'basic' && pt.label.toLowerCase().includes(query)
                      )
                      const advancedTypes = PROPERTY_TYPES.filter(
                        (pt) => pt.category === 'advanced' && pt.label.toLowerCase().includes(query)
                      )

                      if (basicTypes.length === 0 && advancedTypes.length === 0) {
                        return (
                          <div className="px-2 py-4 text-center text-xs text-muted-foreground/60">
                            Tidak ada hasil
                          </div>
                        )
                      }

                      return (
                        <>
                          {basicTypes.length > 0 && (
                            <>
                              <div className="px-1 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                                Pilih jenis
                              </div>
                              <div className="grid grid-cols-2 gap-0.5">
                                {basicTypes.map((pt) => (
                                  <button
                                    key={pt.type}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent"
                                    onClick={() => handleAddProperty(pt.type)}
                                  >
                                    <span className="shrink-0 text-muted-foreground">{pt.icon}</span>
                                    <span className="truncate">{pt.label}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                          {advancedTypes.length > 0 && (
                            <>
                              <div className="my-1 border-t border-border" />
                              <div className="px-1 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                                Lanjutan
                              </div>
                              <div className="grid grid-cols-2 gap-0.5">
                                {advancedTypes.map((pt) => (
                                  <button
                                    key={pt.type}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors hover:bg-accent"
                                    onClick={() => handleAddProperty(pt.type)}
                                  >
                                    <span className="shrink-0 text-muted-foreground">{pt.icon}</span>
                                    <span className="truncate">{pt.label}</span>
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {/* Property visibility "⋯" button */}
            <div className="flex h-8 w-[40px] shrink-0 items-center justify-center">
              <Popover open={showPropVisibility} onOpenChange={(open) => {
                setShowPropVisibility(open)
                if (!open) setPropSearchQuery('')
              }}>
                <PopoverTrigger asChild>
                  <button className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="end" side="bottom" sideOffset={4}>
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={() => setShowPropVisibility(false)}
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                      </button>
                      <span className="text-sm font-medium">Visibilitas properti</span>
                    </div>
                    <button
                      className="flex h-5 w-5 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                      onClick={() => setShowPropVisibility(false)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Search */}
                  <div className="border-b border-border p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                      <Input
                        placeholder="Cari properti..."
                        value={propSearchQuery}
                        onChange={(e) => setPropSearchQuery(e.target.value)}
                        className="h-8 pl-7 text-sm"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Property lists */}
                  <div className="max-h-[400px] overflow-y-auto overscroll-contain">
                    {(() => {
                      const allProps = store.getProperties(databasePage.id)
                      const query = propSearchQuery.toLowerCase()
                      const filtered = allProps.filter(p => p.name.toLowerCase().includes(query))
                      const visible = filtered.filter(p => !p.isHidden)
                      const hidden = filtered.filter(p => p.isHidden)

                      const getIcon = (type: Property['type']) => {
                        const found = PROPERTY_TYPES.find(pt => pt.type === type)
                        return found?.icon || <Type className="h-4 w-4" />
                      }

                      return (
                        <>
                          {/* Visible properties */}
                          {visible.length > 0 && (
                            <div className="p-1.5">
                              <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                                  Ditampilkan di tabel
                                </span>
                                <button
                                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                  onClick={() => {
                                    visible.forEach(p => {
                                      if (p.name !== 'Name') store.togglePropertyHidden(databasePage.id, p.id)
                                    })
                                  }}
                                >
                                  Sembunyikan semua
                                </button>
                              </div>
                              <div className="space-y-0.5">
                                {visible.map(p => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors group"
                                  >
                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/60 cursor-grab shrink-0" />
                                    <span className="text-muted-foreground shrink-0">{getIcon(p.type)}</span>
                                    <span className="flex-1 truncate">{p.name}</span>
                                    <button
                                      className={cn(
                                        'flex h-5 w-5 items-center justify-center rounded-sm shrink-0 transition-colors',
                                        p.name === 'Name' ? 'text-muted-foreground/20 cursor-not-allowed' : 'text-muted-foreground hover:text-foreground'
                                      )}
                                      onClick={() => p.name !== 'Name' && store.togglePropertyHidden(databasePage.id, p.id)}
                                      disabled={p.name === 'Name'}
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Hidden properties */}
                          {hidden.length > 0 && (
                            <div className="border-t border-border p-1.5">
                              <div className="flex items-center justify-between px-2 py-1">
                                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
                                  Disembunyikan di tabel
                                </span>
                                <button
                                  className="text-[11px] font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                  onClick={() => {
                                    hidden.forEach(p => store.togglePropertyHidden(databasePage.id, p.id))
                                  }}
                                >
                                  Tampilkan semua
                                </button>
                              </div>
                              <div className="space-y-0.5">
                                {hidden.map(p => (
                                  <div
                                    key={p.id}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors text-muted-foreground/60 group"
                                  >
                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 cursor-grab shrink-0" />
                                    <span className="shrink-0 opacity-50">{getIcon(p.type)}</span>
                                    <span className="flex-1 truncate">{p.name}</span>
                                    <button
                                      className="flex h-5 w-5 items-center justify-center rounded-sm shrink-0 text-muted-foreground/40 hover:text-foreground transition-colors"
                                      onClick={() => store.togglePropertyHidden(databasePage.id, p.id)}
                                    >
                                      <EyeOff className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {filtered.length === 0 && (
                            <div className="px-3 py-6 text-center text-xs text-muted-foreground/60">
                              Tidak ada properti ditemukan
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Data Rows - Grouped or Flat */}
          {groupedRows ? (
            Array.from(groupedRows.entries()).map(([groupKey, groupRows]) => {
              const isCollapsed = collapsedGroups.has(groupKey)
              return (
                <div key={groupKey}>
                  {/* Group Header */}
                  <button
                    className="flex w-full items-center gap-2 border-b border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
                    onClick={() => toggleGroupCollapse(groupKey)}
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span>{groupKey}</span>
                    <span className="text-xs text-muted-foreground">({groupRows.length})</span>
                  </button>
                  {!isCollapsed && renderRows(groupRows)}
                </div>
              )
            })
          ) : (
            renderRows(processedRows)
          )}

          {/* Calculation Footer */}
          {hasCalculations && (
            <div className="flex border-b border-border bg-muted/20">
              {properties.map((property) => {
                const calc = calculations.find((c) => c.propertyId === property.id)
                const calcType = calc?.type || 'none'
                return (
                  <div
                    key={property.id}
                    className="flex h-8 w-[200px] shrink-0 items-center border-r border-border px-2 text-xs text-muted-foreground"
                  >
                    {calcType !== 'none' && (
                      <span className="font-medium text-violet-400">
                        {computeCalculation(calcType, processedRows, property.id, getPropertyValue)}
                      </span>
                    )}
                  </div>
                )
              })}
              <div className="h-8 w-[40px] shrink-0" />
            </div>
          )}

          {/* Add Row Button */}
          <button
            className="flex h-8 w-full items-center gap-1.5 px-2 text-sm text-muted-foreground/60 transition-colors hover:bg-muted/30 hover:text-foreground"
            onClick={handleAddRow}
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </button>
        </div>
      </div>
    </div>
  )
}
