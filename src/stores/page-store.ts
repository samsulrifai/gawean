import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Page } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Map Supabase row to Page type
const mapRow = (row: Record<string, unknown>): Page => ({
  id: row.id as string,
  parentPageId: (row.parent_page_id as string) || null,
  title: (row.title as string) || 'Untitled',
  icon: (row.icon as string) || '📄',
  coverImage: (row.cover_image as string) || null,
  isDatabase: row.is_database as boolean,
  isTrashed: row.is_trashed as boolean,
  isFavorited: row.is_favorited as boolean,
  content: row.content as unknown,
  position: row.position as number,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
})

// Map Page to Supabase insert/update
const mapToRow = (page: Partial<Page> & { userId?: string }) => {
  const row: Record<string, unknown> = {}
  if (page.userId !== undefined) row.user_id = page.userId
  if (page.parentPageId !== undefined) row.parent_page_id = page.parentPageId
  if (page.title !== undefined) row.title = page.title
  if (page.icon !== undefined) row.icon = page.icon
  if (page.coverImage !== undefined) row.cover_image = page.coverImage
  if (page.isDatabase !== undefined) row.is_database = page.isDatabase
  if (page.isTrashed !== undefined) row.is_trashed = page.isTrashed
  if (page.isFavorited !== undefined) row.is_favorited = page.isFavorited
  if (page.content !== undefined) row.content = page.content
  if (page.position !== undefined) row.position = page.position
  return row
}

interface PageState {
  pages: Page[]
  activePage: Page | null
  expandedPages: Set<string>
  isLoaded: boolean
  realtimeChannel: RealtimeChannel | null

  // Actions
  loadPages: () => Promise<void>
  setActivePage: (page: Page | null) => void
  addPage: (parentPageId?: string | null) => Page
  updatePage: (id: string, updates: Partial<Page>) => void
  deletePage: (id: string) => void
  trashPage: (id: string) => void
  restorePage: (id: string) => void
  toggleFavorite: (id: string) => void
  toggleExpanded: (id: string) => void
  getChildPages: (parentId: string | null) => Page[]
  getFavoritePages: () => Page[]
  getTrashedPages: () => Page[]
  saveContent: (pageId: string, content: unknown) => void
  cleanup: () => void
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  activePage: null,
  expandedPages: new Set<string>(),
  isLoaded: false,
  realtimeChannel: null,

  loadPages: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Failed to load pages:', error)
      return
    }

    const pages = (data || []).map(mapRow)
    set({ pages, isLoaded: true })

    // Subscribe to realtime changes
    const channel = supabase
      .channel('pages-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pages', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const newPage = mapRow(payload.new)
            // Only add if not already present (avoid duplicates from optimistic updates)
            if (!state.pages.find(p => p.id === newPage.id)) {
              set({ pages: [...state.pages, newPage] })
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapRow(payload.new)
            set({
              pages: state.pages.map(p => p.id === updated.id ? updated : p),
              activePage: state.activePage?.id === updated.id ? updated : state.activePage,
            })
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as { id: string }).id
            set({
              pages: state.pages.filter(p => p.id !== deletedId),
              activePage: state.activePage?.id === deletedId ? null : state.activePage,
            })
          }
        }
      )
      .subscribe()

    set({ realtimeChannel: channel })
  },

  setActivePage: (page) => set({ activePage: page }),

  addPage: (parentPageId = null) => {
    const newPage: Page = {
      id: crypto.randomUUID(),
      parentPageId,
      title: 'Untitled',
      icon: '📄',
      coverImage: null,
      isDatabase: false,
      isTrashed: false,
      isFavorited: false,
      position: get().pages.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Optimistic update
    set((state) => ({ pages: [...state.pages, newPage] }))

    // Persist to Supabase
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('pages').insert({
        id: newPage.id,
        user_id: user.id,
        parent_page_id: parentPageId,
        title: newPage.title,
        icon: newPage.icon,
        is_database: false,
        is_trashed: false,
        is_favorited: false,
        position: newPage.position,
      })

      if (error) console.error('Failed to add page:', error)
    })()

    return newPage
  },

  updatePage: (id, updates) => {
    // Optimistic update
    set((state) => ({
      pages: state.pages.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
      activePage:
        state.activePage?.id === id
          ? { ...state.activePage, ...updates, updatedAt: new Date().toISOString() }
          : state.activePage,
    }))

    // Persist to Supabase
    const row = mapToRow(updates)
    if (Object.keys(row).length > 0) {
      supabase.from('pages').update(row).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update page:', error)
      })
    }
  },

  deletePage: (id) => {
    // Optimistic update
    set((state) => ({
      pages: state.pages.filter((p) => p.id !== id),
      activePage: state.activePage?.id === id ? null : state.activePage,
    }))

    // Persist
    supabase.from('pages').delete().eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to delete page:', error)
    })
  },

  trashPage: (id) => {
    // Optimistic update
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, isTrashed: true } : p)),
      activePage: state.activePage?.id === id ? null : state.activePage,
    }))

    // Persist
    supabase.from('pages').update({ is_trashed: true }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to trash page:', error)
    })
  },

  restorePage: (id) => {
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, isTrashed: false } : p)),
    }))

    supabase.from('pages').update({ is_trashed: false }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to restore page:', error)
    })
  },

  toggleFavorite: (id) => {
    const page = get().pages.find(p => p.id === id)
    if (!page) return

    const newVal = !page.isFavorited
    set((state) => ({
      pages: state.pages.map((p) => p.id === id ? { ...p, isFavorited: newVal } : p),
    }))

    supabase.from('pages').update({ is_favorited: newVal }).eq('id', id).then(({ error }) => {
      if (error) console.error('Failed to toggle favorite:', error)
    })
  },

  toggleExpanded: (id) =>
    set((state) => {
      const newExpanded = new Set(state.expandedPages)
      if (newExpanded.has(id)) {
        newExpanded.delete(id)
      } else {
        newExpanded.add(id)
      }
      return { expandedPages: newExpanded }
    }),

  getChildPages: (parentId) =>
    get()
      .pages.filter((p) => p.parentPageId === parentId && !p.isTrashed)
      .sort((a, b) => a.position - b.position),

  getFavoritePages: () =>
    get()
      .pages.filter((p) => p.isFavorited && !p.isTrashed)
      .sort((a, b) => a.position - b.position),

  getTrashedPages: () =>
    get()
      .pages.filter((p) => p.isTrashed)
      .sort((a, b) => a.position - b.position),

  saveContent: (pageId, content) => {
    // Optimistic local update (store on the page object)
    set((state) => ({
      pages: state.pages.map(p => p.id === pageId ? { ...p, content } : p),
    }))

    // Persist to Supabase
    supabase.from('pages').update({ content }).eq('id', pageId).then(({ error }) => {
      if (error) console.error('Failed to save content:', error)
    })
  },

  cleanup: () => {
    const channel = get().realtimeChannel
    if (channel) {
      supabase.removeChannel(channel)
    }
    set({ realtimeChannel: null, pages: [], activePage: null, isLoaded: false })
  },
}))
