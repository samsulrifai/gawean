import { usePageStore } from '@/stores/page-store'
import { useUIStore } from '@/stores/ui-store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Undo2, Trash2 } from 'lucide-react'

export function TrashDialog() {
  const { getTrashedPages, restorePage, deletePage } = usePageStore()
  const { isTrashOpen, toggleTrash } = useUIStore()

  const trashedPages = getTrashedPages()

  return (
    <Dialog open={isTrashOpen} onOpenChange={toggleTrash}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Trash
          </DialogTitle>
          <DialogDescription>
            Pages in trash will be permanently deleted after 30 days.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {trashedPages.length === 0 ? (
            <div className="py-8 text-center">
              <Trash2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Trash is empty</p>
            </div>
          ) : (
            <div className="space-y-1">
              {trashedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-accent"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{page.icon}</span>
                    <span className="text-sm">{page.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => restorePage(page.id)}
                    >
                      <Undo2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deletePage(page.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
