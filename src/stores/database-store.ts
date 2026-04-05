import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type {
  Property,
  PropertyValue,
  DatabaseView,
  SortRule,
  FilterConfig,
  FilterRule,
  CalculationType,
  ColumnCalculation,
} from '@/types'

const generateId = () => crypto.randomUUID()

// Color palette for select options
export const SELECT_COLORS = [
  { name: 'Gray', bg: 'bg-zinc-500/15', text: 'text-zinc-400', dot: 'bg-zinc-400' },
  { name: 'Brown', bg: 'bg-amber-800/15', text: 'text-amber-600', dot: 'bg-amber-600' },
  { name: 'Orange', bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  { name: 'Yellow', bg: 'bg-yellow-500/15', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  { name: 'Green', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  { name: 'Blue', bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  { name: 'Purple', bg: 'bg-violet-500/15', text: 'text-violet-400', dot: 'bg-violet-400' },
  { name: 'Pink', bg: 'bg-pink-500/15', text: 'text-pink-400', dot: 'bg-pink-400' },
  { name: 'Red', bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
]

// Map Supabase row → Property
const mapProperty = (row: Record<string, unknown>): Property => ({
  id: row.id as string,
  databaseId: row.database_id as string,
  name: row.name as string,
  type: row.type as Property['type'],
  options: (row.options as Property['options']) || {},
  position: row.position as number,
  isHidden: row.is_hidden as boolean,
  isFrozen: row.is_frozen as boolean,
  wrapContent: row.wrap_content as boolean,
})

// Map Supabase row → PropertyValue
const mapPropertyValue = (row: Record<string, unknown>): PropertyValue => ({
  id: row.id as string,
  pageId: row.page_id as string,
  propertyId: row.property_id as string,
  value: row.value as unknown,
})

interface DatabaseState {
  properties: Record<string, Property[]>
  propertyValues: Record<string, PropertyValue[]>
  views: Record<string, DatabaseView[]>
  loadedDatabases: Set<string>

  // Init
  initDatabase: (databasePageId: string) => void

  // Property CRUD
  addProperty: (databaseId: string, name: string, type: Property['type']) => Property
  updateProperty: (databaseId: string, propertyId: string, updates: Partial<Property>) => void
  deleteProperty: (databaseId: string, propertyId: string) => void
  getProperties: (databaseId: string) => Property[]
  getVisibleProperties: (databaseId: string) => Property[]

  // Property operations
  duplicateProperty: (databaseId: string, propertyId: string) => void
  insertPropertyAt: (databaseId: string, refPropertyId: string, direction: 'left' | 'right') => void
  togglePropertyHidden: (databaseId: string, propertyId: string) => void
  togglePropertyFrozen: (databaseId: string, propertyId: string) => void
  togglePropertyWrap: (databaseId: string, propertyId: string) => void

  // Values
  setPropertyValue: (rowPageId: string, propertyId: string, value: unknown) => void
  getPropertyValues: (rowPageId: string) => PropertyValue[]
  getPropertyValue: (rowPageId: string, propertyId: string) => unknown

  // Sort
  setSortConfig: (databaseId: string, sortConfig: SortRule[]) => void
  addSortRule: (databaseId: string, propertyId: string, direction: 'asc' | 'desc') => void
  removeSortRule: (databaseId: string, propertyId: string) => void
  getSortConfig: (databaseId: string) => SortRule[]

  // Filter
  setFilterConfig: (databaseId: string, filterConfig: FilterConfig | null) => void
  addFilterRule: (databaseId: string, rule: Omit<FilterRule, 'id'>) => void
  updateFilterRule: (databaseId: string, ruleId: string, updates: Partial<FilterRule>) => void
  removeFilterRule: (databaseId: string, ruleId: string) => void
  getFilterConfig: (databaseId: string) => FilterConfig | null

  // Group
  setGroupBy: (databaseId: string, propertyId: string | null) => void
  getGroupBy: (databaseId: string) => string | null

  // Calculations
  setColumnCalculation: (databaseId: string, propertyId: string, calcType: CalculationType) => void
  getColumnCalculation: (databaseId: string, propertyId: string) => CalculationType
  getCalculations: (databaseId: string) => ColumnCalculation[]

  // Views
  addView: (databaseId: string, name: string, type: DatabaseView['type']) => DatabaseView
  getViews: (databaseId: string) => DatabaseView[]
}

// Helper to get or create default view
function getDefaultView(state: DatabaseState, databaseId: string): DatabaseView {
  const views = state.views[databaseId] || []
  return views[0] || {
    id: generateId(),
    databaseId,
    name: 'Default View',
    type: 'table' as const,
    filterConfig: null,
    sortConfig: [],
    groupByPropertyId: null,
    calculations: [],
    visibleProperties: [],
    position: 0,
  }
}

function updateDefaultView(
  state: DatabaseState,
  databaseId: string,
  updates: Partial<DatabaseView>
): Record<string, DatabaseView[]> {
  const views = state.views[databaseId] || []
  if (views.length === 0) {
    const newView = { ...getDefaultView(state, databaseId), ...updates }
    return { ...state.views, [databaseId]: [newView] }
  }
  return {
    ...state.views,
    [databaseId]: views.map((v, i) => (i === 0 ? { ...v, ...updates } : v)),
  }
}

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  properties: {},
  propertyValues: {},
  views: {},
  loadedDatabases: new Set(),

  initDatabase: (databasePageId) => {
    const loaded = get().loadedDatabases
    if (loaded.has(databasePageId)) return

    // Mark as loading
    set(state => ({
      loadedDatabases: new Set([...state.loadedDatabases, databasePageId]),
    }))

    // Load properties from Supabase
    ;(async () => {
      const { data: propsData, error: propsErr } = await supabase
        .from('properties')
        .select('*')
        .eq('database_id', databasePageId)
        .order('position', { ascending: true })

      if (propsErr) {
        console.error('Failed to load properties:', propsErr)
        return
      }

      const properties = (propsData || []).map(mapProperty)

      // Load all property values for pages in this database
      // Get child pages of the database page
      const { data: pagesData } = await supabase
        .from('pages')
        .select('id')
        .eq('parent_page_id', databasePageId)

      const pageIds = (pagesData || []).map((p: { id: string }) => p.id)

      let allValues: PropertyValue[] = []
      if (pageIds.length > 0) {
        const { data: valuesData, error: valuesErr } = await supabase
          .from('property_values')
          .select('*')
          .in('page_id', pageIds)

        if (valuesErr) {
          console.error('Failed to load property values:', valuesErr)
        } else {
          allValues = (valuesData || []).map(mapPropertyValue)
        }
      }

      // Group values by page ID
      const valuesByPage: Record<string, PropertyValue[]> = {}
      allValues.forEach(v => {
        if (!valuesByPage[v.pageId]) valuesByPage[v.pageId] = []
        valuesByPage[v.pageId].push(v)
      })

      const defaultView: DatabaseView = {
        id: generateId(),
        databaseId: databasePageId,
        name: 'Default View',
        type: 'table',
        filterConfig: null,
        sortConfig: [],
        groupByPropertyId: null,
        calculations: [],
        visibleProperties: properties.map(p => p.id),
        position: 0,
      }

      set(state => ({
        properties: { ...state.properties, [databasePageId]: properties },
        propertyValues: { ...state.propertyValues, ...valuesByPage },
        views: { ...state.views, [databasePageId]: [defaultView] },
      }))
    })()
  },

  // ─── Property CRUD ───

  addProperty: (databaseId, name, type) => {
    const props = get().properties[databaseId] || []
    const newProp: Property = {
      id: generateId(),
      databaseId,
      name,
      type,
      options: type === 'select' || type === 'status' || type === 'multi_select'
        ? { selectOptions: [] }
        : {},
      position: props.length,
    }

    // Optimistic update
    set((state) => ({
      properties: {
        ...state.properties,
        [databaseId]: [...(state.properties[databaseId] || []), newProp],
      },
    }))

    // Persist
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('properties').insert({
        id: newProp.id,
        user_id: user.id,
        database_id: databaseId,
        name: newProp.name,
        type: newProp.type,
        options: newProp.options,
        position: newProp.position,
      })

      if (error) console.error('Failed to add property:', error)
    })()

    return newProp
  },

  updateProperty: (databaseId, propertyId, updates) => {
    set((state) => ({
      properties: {
        ...state.properties,
        [databaseId]: (state.properties[databaseId] || []).map((p) =>
          p.id === propertyId ? { ...p, ...updates } : p
        ),
      },
    }))

    // Persist relevant fields
    const row: Record<string, unknown> = {}
    if (updates.name !== undefined) row.name = updates.name
    if (updates.type !== undefined) row.type = updates.type
    if (updates.options !== undefined) row.options = updates.options
    if (updates.position !== undefined) row.position = updates.position
    if (updates.isHidden !== undefined) row.is_hidden = updates.isHidden
    if (updates.isFrozen !== undefined) row.is_frozen = updates.isFrozen
    if (updates.wrapContent !== undefined) row.wrap_content = updates.wrapContent

    if (Object.keys(row).length > 0) {
      supabase.from('properties').update(row).eq('id', propertyId).then(({ error }) => {
        if (error) console.error('Failed to update property:', error)
      })
    }
  },

  deleteProperty: (databaseId, propertyId) => {
    set((state) => {
      const filtered = (state.properties[databaseId] || [])
        .filter((p) => p.id !== propertyId)
        .map((p, i) => ({ ...p, position: i }))
      return {
        properties: { ...state.properties, [databaseId]: filtered },
      }
    })

    supabase.from('properties').delete().eq('id', propertyId).then(({ error }) => {
      if (error) console.error('Failed to delete property:', error)
    })
  },

  getProperties: (databaseId) =>
    (get().properties[databaseId] || []).sort((a, b) => a.position - b.position),

  getVisibleProperties: (databaseId) =>
    (get().properties[databaseId] || [])
      .filter((p) => !p.isHidden)
      .sort((a, b) => a.position - b.position),

  // ─── Property Operations ───

  duplicateProperty: (databaseId, propertyId) => {
    const props = get().properties[databaseId] || []
    const source = props.find((p) => p.id === propertyId)
    if (!source) return

    const newProp: Property = {
      ...source,
      id: generateId(),
      name: `${source.name} (copy)`,
      position: source.position + 0.5,
    }

    const allValues = get().propertyValues
    const newValues = { ...allValues }
    for (const [rowId, vals] of Object.entries(allValues)) {
      const sourceVal = vals.find((v) => v.propertyId === propertyId)
      if (sourceVal) {
        newValues[rowId] = [
          ...(newValues[rowId] || []),
          { id: generateId(), pageId: rowId, propertyId: newProp.id, value: sourceVal.value },
        ]
      }
    }

    set((state) => {
      const updated = [...(state.properties[databaseId] || []), newProp]
        .sort((a, b) => a.position - b.position)
        .map((p, i) => ({ ...p, position: i }))
      return {
        properties: { ...state.properties, [databaseId]: updated },
        propertyValues: newValues,
      }
    })

    // Persist the new property
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('properties').insert({
        id: newProp.id,
        user_id: user.id,
        database_id: databaseId,
        name: newProp.name,
        type: newProp.type,
        options: newProp.options,
        position: newProp.position,
      })
    })()
  },

  insertPropertyAt: (databaseId, refPropertyId, direction) => {
    const props = get().properties[databaseId] || []
    const refProp = props.find((p) => p.id === refPropertyId)
    if (!refProp) return

    const newProp: Property = {
      id: generateId(),
      databaseId,
      name: `Column ${props.length + 1}`,
      type: 'text',
      options: {},
      position: direction === 'left' ? refProp.position - 0.5 : refProp.position + 0.5,
    }

    set((state) => {
      const updated = [...(state.properties[databaseId] || []), newProp]
        .sort((a, b) => a.position - b.position)
        .map((p, i) => ({ ...p, position: i }))
      return {
        properties: { ...state.properties, [databaseId]: updated },
      }
    })

    // Persist
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('properties').insert({
        id: newProp.id,
        user_id: user.id,
        database_id: databaseId,
        name: newProp.name,
        type: newProp.type,
        options: newProp.options,
        position: newProp.position,
      })
    })()
  },

  togglePropertyHidden: (databaseId, propertyId) => {
    const prop = (get().properties[databaseId] || []).find(p => p.id === propertyId)
    if (!prop) return

    const newVal = !prop.isHidden
    set((state) => ({
      properties: {
        ...state.properties,
        [databaseId]: (state.properties[databaseId] || []).map((p) =>
          p.id === propertyId ? { ...p, isHidden: newVal } : p
        ),
      },
    }))

    supabase.from('properties').update({ is_hidden: newVal }).eq('id', propertyId).then(({ error }) => {
      if (error) console.error('Failed to toggle hidden:', error)
    })
  },

  togglePropertyFrozen: (databaseId, propertyId) => {
    const prop = (get().properties[databaseId] || []).find(p => p.id === propertyId)
    if (!prop) return

    const newVal = !prop.isFrozen
    set((state) => ({
      properties: {
        ...state.properties,
        [databaseId]: (state.properties[databaseId] || []).map((p) =>
          p.id === propertyId ? { ...p, isFrozen: newVal } : p
        ),
      },
    }))

    supabase.from('properties').update({ is_frozen: newVal }).eq('id', propertyId).then(({ error }) => {
      if (error) console.error('Failed to toggle frozen:', error)
    })
  },

  togglePropertyWrap: (databaseId, propertyId) => {
    const prop = (get().properties[databaseId] || []).find(p => p.id === propertyId)
    if (!prop) return

    const newVal = !prop.wrapContent
    set((state) => ({
      properties: {
        ...state.properties,
        [databaseId]: (state.properties[databaseId] || []).map((p) =>
          p.id === propertyId ? { ...p, wrapContent: newVal } : p
        ),
      },
    }))

    supabase.from('properties').update({ wrap_content: newVal }).eq('id', propertyId).then(({ error }) => {
      if (error) console.error('Failed to toggle wrap:', error)
    })
  },

  // ─── Values ───

  setPropertyValue: (rowPageId, propertyId, value) => {
    // Optimistic update
    set((state) => {
      const existing = state.propertyValues[rowPageId] || []
      const idx = existing.findIndex((pv) => pv.propertyId === propertyId)
      let updated: PropertyValue[]
      if (idx >= 0) {
        updated = existing.map((pv, i) => (i === idx ? { ...pv, value } : pv))
      } else {
        updated = [
          ...existing,
          { id: generateId(), pageId: rowPageId, propertyId, value },
        ]
      }
      return { propertyValues: { ...state.propertyValues, [rowPageId]: updated } }
    })

    // Persist with upsert
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('property_values').upsert(
        {
          user_id: user.id,
          page_id: rowPageId,
          property_id: propertyId,
          value: value as never,
        },
        { onConflict: 'page_id,property_id' }
      )

      if (error) console.error('Failed to set property value:', error)
    })()
  },

  getPropertyValues: (rowPageId) => get().propertyValues[rowPageId] || [],

  getPropertyValue: (rowPageId, propertyId) => {
    const vals = get().propertyValues[rowPageId] || []
    return vals.find((v) => v.propertyId === propertyId)?.value ?? null
  },

  // ─── Sort (client-side view state) ───

  setSortConfig: (databaseId, sortConfig) =>
    set((state) => ({
      views: updateDefaultView(state, databaseId, { sortConfig }),
    })),

  addSortRule: (databaseId, propertyId, direction) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.sortConfig || []) as SortRule[]
    const filtered = existing.filter((s) => s.propertyId !== propertyId)
    set((state) => ({
      views: updateDefaultView(state, databaseId, {
        sortConfig: [...filtered, { propertyId, direction }],
      }),
    }))
  },

  removeSortRule: (databaseId, propertyId) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.sortConfig || []) as SortRule[]
    set((state) => ({
      views: updateDefaultView(state, databaseId, {
        sortConfig: existing.filter((s) => s.propertyId !== propertyId),
      }),
    }))
  },

  getSortConfig: (databaseId) => {
    const view = getDefaultView(get(), databaseId)
    return (view.sortConfig || []) as SortRule[]
  },

  // ─── Filter (client-side view state) ───

  setFilterConfig: (databaseId, filterConfig) =>
    set((state) => ({
      views: updateDefaultView(state, databaseId, { filterConfig }),
    })),

  addFilterRule: (databaseId, rule) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.filterConfig as FilterConfig | null) || { conjunction: 'and' as const, rules: [] }
    const newRule: FilterRule = { ...rule, id: generateId() }
    set((state) => ({
      views: updateDefaultView(state, databaseId, {
        filterConfig: { ...existing, rules: [...existing.rules, newRule] },
      }),
    }))
  },

  updateFilterRule: (databaseId, ruleId, updates) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.filterConfig as FilterConfig | null)
    if (!existing) return
    set((state) => ({
      views: updateDefaultView(state, databaseId, {
        filterConfig: {
          ...existing,
          rules: existing.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
        },
      }),
    }))
  },

  removeFilterRule: (databaseId, ruleId) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.filterConfig as FilterConfig | null)
    if (!existing) return
    const newRules = existing.rules.filter((r) => r.id !== ruleId)
    set((state) => ({
      views: updateDefaultView(state, databaseId, {
        filterConfig: newRules.length > 0 ? { ...existing, rules: newRules } : null,
      }),
    }))
  },

  getFilterConfig: (databaseId) => {
    const view = getDefaultView(get(), databaseId)
    return (view.filterConfig as FilterConfig | null) || null
  },

  // ─── Group (client-side view state) ───

  setGroupBy: (databaseId, propertyId) =>
    set((state) => ({
      views: updateDefaultView(state, databaseId, { groupByPropertyId: propertyId }),
    })),

  getGroupBy: (databaseId) => {
    const view = getDefaultView(get(), databaseId)
    return view.groupByPropertyId || null
  },

  // ─── Calculations (client-side view state) ───

  setColumnCalculation: (databaseId, propertyId, calcType) => {
    const view = getDefaultView(get(), databaseId)
    const existing = (view.calculations || []) as ColumnCalculation[]
    const filtered = existing.filter((c) => c.propertyId !== propertyId)
    const updated = calcType === 'none'
      ? filtered
      : [...filtered, { propertyId, type: calcType }]
    set((state) => ({
      views: updateDefaultView(state, databaseId, { calculations: updated }),
    }))
  },

  getColumnCalculation: (databaseId, propertyId) => {
    const view = getDefaultView(get(), databaseId)
    const calcs = (view.calculations || []) as ColumnCalculation[]
    return calcs.find((c) => c.propertyId === propertyId)?.type || 'none'
  },

  getCalculations: (databaseId) => {
    const view = getDefaultView(get(), databaseId)
    return (view.calculations || []) as ColumnCalculation[]
  },

  // ─── Views ───

  addView: (databaseId, name, type) => {
    const views = get().views[databaseId] || []
    const newView: DatabaseView = {
      id: generateId(),
      databaseId,
      name,
      type,
      filterConfig: null,
      sortConfig: [],
      groupByPropertyId: null,
      calculations: [],
      visibleProperties: (get().properties[databaseId] || []).map((p) => p.id),
      position: views.length,
    }
    set((state) => ({
      views: {
        ...state.views,
        [databaseId]: [...(state.views[databaseId] || []), newView],
      },
    }))
    return newView
  },

  getViews: (databaseId) =>
    (get().views[databaseId] || []).sort((a, b) => a.position - b.position),
}))
