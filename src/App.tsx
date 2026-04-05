import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/sidebar/app-sidebar'
import { PageView } from '@/components/page/page-view'
import { SearchDialog } from '@/components/search/search-dialog'
import { TrashDialog } from '@/components/trash/trash-dialog'
import { AuthPage } from '@/components/auth/auth-page'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { usePageStore } from '@/stores/page-store'
import { Loader2 } from 'lucide-react'

function App() {
  const { isDarkMode } = useUIStore()
  const { user, isLoading, isInitialized, initialize } = useAuthStore()
  const { loadPages, isLoaded } = usePageStore()

  // Initialize auth on mount
  useEffect(() => {
    initialize()
  }, [initialize])

  // Load pages when user is authenticated
  useEffect(() => {
    if (user && !isLoaded) {
      loadPages()
    }
  }, [user, isLoaded, loadPages])

  // Initialize dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Loading state
  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-2xl font-bold text-white shadow-lg shadow-violet-500/25">
            G
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    )
  }

  // Not authenticated → show auth page
  if (!user) {
    return <AuthPage />
  }

  // Authenticated → show workspace
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <AppSidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <PageView />
        </main>

        {/* Dialogs */}
        <SearchDialog />
        <TrashDialog />
      </div>
    </TooltipProvider>
  )
}

export default App
