import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/api/useAuth';

export function Navbar() {
  const { user, clearAuth } = useAuthStore();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
    >
      <div className="container flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            NoteSync
          </h1>
          <Button variant="ghost" size="sm" className="gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Search</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">New Note</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user?.fullname?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.nav>
  );
}

