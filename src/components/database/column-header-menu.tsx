import { useState } from 'react'
import { useDatabaseStore } from '@/stores/database-store'
import type { Property, PropertyType, CalculationType, SortRule } from '@/types'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import {
  Pencil, Filter, ArrowUpDown, LayoutGrid, Calculator,
  Snowflake, EyeOff, WrapText, ArrowLeftToLine, ArrowRightToLine,
  Copy, Trash2, ChevronRight, ArrowUpNarrowWide, ArrowDownNarrowWide,
  X, Check,
  Type, Hash, CircleDot, ListChecks, Calendar, User, Paperclip,
  CheckSquare, Link2, Phone, Mail, FunctionSquare,
} from 'lucide-react'

// Property type config for the edit submenu
const PROPERTY_TYPE_OPTIONS: { type: PropertyType; label: string; icon: React.ReactNode }[] = [
  { type: 'text', label: 'Teks', icon: <Type className="h-4 w-4" /> },
  { type: 'number', label: 'Angka', icon: <Hash className="h-4 w-4" /> },
  { type: 'select', label: 'Pilih', icon: <CircleDot className="h-4 w-4" /> },
  { type: 'multi_select', label: 'Multipilih', icon: <ListChecks className="h-4 w-4" /> },
  { type: 'status', label: 'Status', icon: <CircleDot className="h-4 w-4" /> },
  { type: 'date', label: 'Tanggal', icon: <Calendar className="h-4 w-4" /> },
  { type: 'person', label: 'Orang', icon: <User className="h-4 w-4" /> },
  { type: 'file', label: 'File & media', icon: <Paperclip className="h-4 w-4" /> },
  { type: 'checkbox', label: 'Kotak centang', icon: <CheckSquare className="h-4 w-4" /> },
  { type: 'url', label: 'URL', icon: <Link2 className="h-4 w-4" /> },
  { type: 'phone', label: 'Telepon', icon: <Phone className="h-4 w-4" /> },
  { type: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
  { type: 'formula', label: 'Formula', icon: <FunctionSquare className="h-4 w-4" /> },
]

// Calculation options
const BASE_CALC_OPTIONS: { type: CalculationType; label: string }[] = [
  { type: 'none', label: 'Tidak ada' },
  { type: 'count_all', label: 'Hitung semua' },
  { type: 'count_values', label: 'Hitung nilai' },
  { type: 'count_unique', label: 'Hitung unik' },
  { type: 'count_empty', label: 'Hitung kosong' },
  { type: 'count_not_empty', label: 'Hitung tidak kosong' },
  { type: 'percent_empty', label: 'Persen kosong' },
  { type: 'percent_not_empty', label: 'Persen tidak kosong' },
]
const NUMBER_CALC_OPTIONS: { type: CalculationType; label: string }[] = [
  { type: 'sum', label: 'Jumlah' },
  { type: 'average', label: 'Rata-rata' },
  { type: 'median', label: 'Median' },
  { type: 'min', label: 'Min' },
  { type: 'max', label: 'Max' },
  { type: 'range', label: 'Rentang' },
]

// Get icon for a property type
function getPropertyTypeIcon(type: PropertyType): React.ReactNode {
  const found = PROPERTY_TYPE_OPTIONS.find((pt) => pt.type === type)
  return found?.icon || <Type className="h-4 w-4" />
}

interface ColumnHeaderMenuProps {
  property: Property
  databaseId: string
}

type SubMenu = 'edit' | 'sort' | 'calc' | null

export function ColumnHeaderMenu({ property, databaseId }: ColumnHeaderMenuProps) {
  const [open, setOpen] = useState(false)
  const [subMenu, setSubMenu] = useState<SubMenu>(null)
  const [editName, setEditName] = useState(property.name)
  const [editingName, setEditingName] = useState(false)

  const store = useDatabaseStore()
  const sortConfig = store.getSortConfig(databaseId)
  const currentSort = sortConfig.find((s: SortRule) => s.propertyId === property.id)
  const currentCalc = store.getColumnCalculation(databaseId, property.id)
  const groupBy = store.getGroupBy(databaseId)
  const isGrouped = groupBy === property.id

  const handleClose = () => {
    setOpen(false)
    setSubMenu(null)
    setEditingName(false)
  }

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== property.name) {
      store.updateProperty(databaseId, property.id, { name: editName.trim() })
    }
    setEditingName(false)
  }

  const handleChangeType = (type: PropertyType) => {
    store.updateProperty(databaseId, property.id, { type })
    setSubMenu(null)
  }

  const handleSort = (direction: 'asc' | 'desc') => {
    store.addSortRule(databaseId, property.id, direction)
    handleClose()
  }

  const handleRemoveSort = () => {
    store.removeSortRule(databaseId, property.id)
    handleClose()
  }

  const handleFilter = () => {
    store.addFilterRule(databaseId, {
      propertyId: property.id,
      operator: 'contains',
      value: '',
    })
    handleClose()
  }

  const handleGroup = () => {
    store.setGroupBy(databaseId, isGrouped ? null : property.id)
    handleClose()
  }

  const handleCalc = (calcType: CalculationType) => {
    store.setColumnCalculation(databaseId, property.id, calcType)
    setSubMenu(null)
  }

  const handleFreeze = () => {
    store.togglePropertyFrozen(databaseId, property.id)
    handleClose()
  }

  const handleHide = () => {
    store.togglePropertyHidden(databaseId, property.id)
    handleClose()
  }

  const handleWrap = () => {
    store.togglePropertyWrap(databaseId, property.id)
    handleClose()
  }

  const handleInsertLeft = () => {
    store.insertPropertyAt(databaseId, property.id, 'left')
    handleClose()
  }

  const handleInsertRight = () => {
    store.insertPropertyAt(databaseId, property.id, 'right')
    handleClose()
  }

  const handleDuplicate = () => {
    store.duplicateProperty(databaseId, property.id)
    handleClose()
  }

  const handleDelete = () => {
    store.deleteProperty(databaseId, property.id)
    handleClose()
  }

  const calcOptions = property.type === 'number'
    ? [...BASE_CALC_OPTIONS, ...NUMBER_CALC_OPTIONS]
    : BASE_CALC_OPTIONS

  // ─── Render Sub-menus ───

  const renderEditSubMenu = () => (
    <div className="space-y-1">
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        onClick={() => setSubMenu(null)}
      >
        <ChevronRight className="h-3 w-3 rotate-180" />
        Kembali
      </button>
      <div className="border-t border-border my-1" />
      <div className="px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/50">
        Ubah tipe
      </div>
      <div className="max-h-[220px] overflow-y-auto space-y-0.5">
        {PROPERTY_TYPE_OPTIONS.map((pt) => (
          <button
            key={pt.type}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
              property.type === pt.type && 'bg-accent'
            )}
            onClick={() => handleChangeType(pt.type)}
          >
            <span className="text-muted-foreground">{pt.icon}</span>
            <span className="flex-1 text-left">{pt.label}</span>
            {property.type === pt.type && <Check className="h-3.5 w-3.5 text-violet-400" />}
          </button>
        ))}
      </div>
    </div>
  )

  const renderSortSubMenu = () => (
    <div className="space-y-0.5">
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        onClick={() => setSubMenu(null)}
      >
        <ChevronRight className="h-3 w-3 rotate-180" />
        Kembali
      </button>
      <div className="border-t border-border my-1" />
      <button
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          currentSort?.direction === 'asc' && 'bg-accent'
        )}
        onClick={() => handleSort('asc')}
      >
        <ArrowUpNarrowWide className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">A → Z (Naik)</span>
        {currentSort?.direction === 'asc' && <Check className="h-3.5 w-3.5 text-violet-400" />}
      </button>
      <button
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
          currentSort?.direction === 'desc' && 'bg-accent'
        )}
        onClick={() => handleSort('desc')}
      >
        <ArrowDownNarrowWide className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 text-left">Z → A (Turun)</span>
        {currentSort?.direction === 'desc' && <Check className="h-3.5 w-3.5 text-violet-400" />}
      </button>
      {currentSort && (
        <>
          <div className="border-t border-border my-1" />
          <button
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-400 transition-colors hover:bg-accent"
            onClick={handleRemoveSort}
          >
            <X className="h-4 w-4" />
            Hapus urutan
          </button>
        </>
      )}
    </div>
  )

  const renderCalcSubMenu = () => (
    <div className="space-y-0.5">
      <button
        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
        onClick={() => setSubMenu(null)}
      >
        <ChevronRight className="h-3 w-3 rotate-180" />
        Kembali
      </button>
      <div className="border-t border-border my-1" />
      <div className="max-h-[260px] overflow-y-auto space-y-0.5">
        {calcOptions.map((opt) => (
          <button
            key={opt.type}
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
              currentCalc === opt.type && 'bg-accent'
            )}
            onClick={() => handleCalc(opt.type)}
          >
            <span className="flex-1 text-left">{opt.label}</span>
            {currentCalc === opt.type && <Check className="h-3.5 w-3.5 text-violet-400" />}
          </button>
        ))}
      </div>
    </div>
  )

  // ─── Main Menu ───

  const renderMainMenu = () => (
    <div className="space-y-0.5">
      {/* Editable Name Header */}
      <div className="flex items-center gap-2 border-b border-border px-2 pb-2 mb-1">
        <span className="text-muted-foreground">{getPropertyTypeIcon(property.type)}</span>
        {editingName ? (
          <Input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') {
                setEditName(property.name)
                setEditingName(false)
              }
            }}
            className="h-7 text-sm flex-1"
          />
        ) : (
          <button
            className="flex-1 rounded-md px-1.5 py-1 text-left text-sm font-medium text-foreground hover:bg-accent"
            onClick={() => {
              setEditName(property.name)
              setEditingName(true)
            }}
          >
            {property.name}
          </button>
        )}
      </div>

      {/* Menu Items */}
      <MenuItem
        icon={<Pencil className="h-4 w-4" />}
        label="Edit properti"
        hasArrow
        onClick={() => setSubMenu('edit')}
      />

      <div className="border-t border-border my-1" />

      <MenuItem
        icon={<Filter className="h-4 w-4" />}
        label="Filter"
        onClick={handleFilter}
      />
      <MenuItem
        icon={<ArrowUpDown className="h-4 w-4" />}
        label="Urutkan"
        hasArrow
        badge={currentSort ? (currentSort.direction === 'asc' ? '↑' : '↓') : undefined}
        onClick={() => setSubMenu('sort')}
      />
      <MenuItem
        icon={<LayoutGrid className="h-4 w-4" />}
        label="Grup"
        active={isGrouped}
        onClick={handleGroup}
      />
      <MenuItem
        icon={<Calculator className="h-4 w-4" />}
        label="Hitung"
        hasArrow
        badge={currentCalc !== 'none' ? '•' : undefined}
        onClick={() => setSubMenu('calc')}
      />

      <div className="border-t border-border my-1" />

      <MenuItem
        icon={<Snowflake className="h-4 w-4" />}
        label="Bekukan"
        active={!!property.isFrozen}
        onClick={handleFreeze}
      />
      <MenuItem
        icon={<EyeOff className="h-4 w-4" />}
        label="Sembunyikan"
        onClick={handleHide}
      />
      <MenuItem
        icon={<WrapText className="h-4 w-4" />}
        label="Urai konten"
        active={!!property.wrapContent}
        onClick={handleWrap}
      />

      <div className="border-t border-border my-1" />

      <MenuItem
        icon={<ArrowLeftToLine className="h-4 w-4" />}
        label="Sisipkan di kiri"
        onClick={handleInsertLeft}
      />
      <MenuItem
        icon={<ArrowRightToLine className="h-4 w-4" />}
        label="Sisipkan di kanan"
        onClick={handleInsertRight}
      />

      <div className="border-t border-border my-1" />

      <MenuItem
        icon={<Copy className="h-4 w-4" />}
        label="Duplikatkan properti"
        onClick={handleDuplicate}
      />
      <MenuItem
        icon={<Trash2 className="h-4 w-4" />}
        label="Hapus properti"
        destructive
        onClick={handleDelete}
      />
    </div>
  )

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o)
      if (!o) {
        setSubMenu(null)
        setEditingName(false)
      }
    }}>
      <PopoverTrigger asChild>
        <button className="flex h-full w-full items-center gap-1.5 px-2 text-left text-xs font-medium text-muted-foreground hover:bg-accent/50 transition-colors">
          {getPropertyTypeIcon(property.type)}
          <span className="truncate">{property.name}</span>
          {currentSort && (
            <span className="ml-auto text-violet-400">
              {currentSort.direction === 'asc' ? '↑' : '↓'}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1.5"
        align="start"
        side="bottom"
        sideOffset={0}
      >
        {subMenu === 'edit' && renderEditSubMenu()}
        {subMenu === 'sort' && renderSortSubMenu()}
        {subMenu === 'calc' && renderCalcSubMenu()}
        {subMenu === null && renderMainMenu()}
      </PopoverContent>
    </Popover>
  )
}

// ─── Helper: Menu Item ───

interface MenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  hasArrow?: boolean
  destructive?: boolean
  active?: boolean
  badge?: string
}

function MenuItem({ icon, label, onClick, hasArrow, destructive, active, badge }: MenuItemProps) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
        destructive && 'text-red-400 hover:text-red-300',
        active && 'bg-violet-500/10 text-violet-400'
      )}
      onClick={onClick}
    >
      <span className={cn('shrink-0', destructive ? 'text-red-400/70' : 'text-muted-foreground')}>
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-xs text-violet-400">{badge}</span>
      )}
      {hasArrow && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />}
    </button>
  )
}
