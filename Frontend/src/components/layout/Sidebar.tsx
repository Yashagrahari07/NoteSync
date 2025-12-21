import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUIStore } from '@/stores/ui.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Star, Users } from 'lucide-react';

function SidebarComponent() {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleToggle = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 border-r bg-card/50 backdrop-blur-md z-40"
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold text-sm">Workspace</h2>
            <Button variant="ghost" size="sm" onClick={handleToggle}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100%-4rem)]">
            <nav className="p-2 space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                All Notes
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Star className="h-4 w-4" />
                Starred
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Users className="h-4 w-4" />
                Shared
              </Button>
            </nav>
          </ScrollArea>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export const Sidebar = memo(SidebarComponent);

