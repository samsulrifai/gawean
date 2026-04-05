import type { ReactNode } from 'react'

// ============ PAGE TYPES ============
export interface Page {
  id: string
  parentPageId: string | null
  title: string
  icon: string
  coverImage: string | null
  isDatabase: boolean
  isTrashed: boolean
  isFavorited: boolean
  position: number
  createdAt: string
  updatedAt: string
  content?: unknown
  children?: Page[]
}

// ============ BLOCK TYPES ============
export type BlockType =
  | 'text'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'todo'
  | 'bulletList'
  | 'numberedList'
  | 'toggle'
  | 'quote'
  | 'callout'
  | 'divider'
  | 'code'
  | 'image'
  | 'bookmark'

export interface Block {
  id: string
  pageId: string
  parentBlockId: string | null
  type: BlockType
  properties: Record<string, unknown>
  content: unknown
  position: number
}

// ============ DATABASE TYPES ============
export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone'
  | 'person'
  | 'file'
  | 'relation'
  | 'rollup'
  | 'formula'
  | 'status'
  | 'created_time'
  | 'last_edited_time'
  | 'created_by'
  | 'last_edited_by'
  | 'button'
  | 'id_number'
  | 'location'

export interface SelectOption {
  id: string
  label: string
  color: string
}

export interface Property {
  id: string
  databaseId: string
  name: string
  type: PropertyType
  options: {
    selectOptions?: SelectOption[]
    formulaExpression?: string
    relationDatabaseId?: string
    rollupPropertyId?: string
    rollupAggregation?: string
  }
  position: number
  isHidden?: boolean
  isFrozen?: boolean
  wrapContent?: boolean
}

export interface PropertyValue {
  id: string
  pageId: string
  propertyId: string
  value: unknown
}

// Sort
export type SortDirection = 'asc' | 'desc'
export interface SortRule {
  propertyId: string
  direction: SortDirection
}

// Filter
export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'is_checked'
  | 'is_unchecked'
  | 'before'
  | 'after'
  | 'on_or_before'
  | 'on_or_after'

export interface FilterRule {
  id: string
  propertyId: string
  operator: FilterOperator
  value: string
}

export type FilterConjunction = 'and' | 'or'
export interface FilterConfig {
  conjunction: FilterConjunction
  rules: FilterRule[]
}

// Calculations
export type CalculationType =
  | 'none'
  | 'count_all'
  | 'count_values'
  | 'count_unique'
  | 'count_empty'
  | 'count_not_empty'
  | 'percent_empty'
  | 'percent_not_empty'
  | 'sum'
  | 'average'
  | 'median'
  | 'min'
  | 'max'
  | 'range'

export interface ColumnCalculation {
  propertyId: string
  type: CalculationType
}

export type DatabaseViewType = 'table' | 'board' | 'list' | 'gallery' | 'calendar' | 'timeline'

export interface DatabaseView {
  id: string
  databaseId: string
  name: string
  type: DatabaseViewType
  filterConfig: FilterConfig | null
  sortConfig: SortRule[]
  groupByPropertyId: string | null
  calculations: ColumnCalculation[]
  visibleProperties: string[]
  position: number
}

// ============ SLASH COMMAND TYPES ============
export interface SlashCommandItem {
  title: string
  description: string
  icon: ReactNode
  command: (props: { editor: unknown; range: unknown }) => void
}
