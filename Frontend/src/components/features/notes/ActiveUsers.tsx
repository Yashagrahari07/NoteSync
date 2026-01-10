import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye } from 'lucide-react';

interface ActiveUser {
  userId: string;
  fullname: string;
}

interface ActiveUsersProps {
  users: ActiveUser[];
  currentUserId?: string;
}

// Generate consistent color based on user ID
function getUserColor(userId: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
    'bg-indigo-500',
    'bg-rose-500',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

const MAX_VISIBLE_AVATARS = 4;

function ActiveUsersComponent({ users, currentUserId }: ActiveUsersProps) {
  const visibleUsers = users.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = Math.max(0, users.length - MAX_VISIBLE_AVATARS);
  const isAlone = users.length <= 1;
  const otherUsers = users.filter(u => u.userId !== currentUserId);

  return (
    <div className="space-y-3">
      {/* Header with status indicator */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <p className="text-xs font-medium text-muted-foreground">Active Now</p>
        <span className="text-xs text-muted-foreground/70">
          ({users.length} {users.length === 1 ? 'viewer' : 'viewers'})
        </span>
      </div>

      {/* Overlapping Avatar Stack */}
      <div className="flex items-center">
        <div className="flex -space-x-2">
          <AnimatePresence mode="popLayout">
            {visibleUsers.map((user, index) => {
              const isCurrentUser = user.userId === currentUserId;
              const colorClass = getUserColor(user.userId);

              return (
                <TooltipProvider key={user.userId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          delay: index * 0.05
                        }}
                        style={{ zIndex: visibleUsers.length - index }}
                        className="relative"
                      >
                        <Avatar
                          className={`h-9 w-9 border-2 border-background ring-2 ring-background cursor-pointer 
                            hover:z-50 hover:scale-110 transition-transform duration-200
                            ${isCurrentUser ? 'ring-primary/50' : ''}`}
                        >
                          <AvatarFallback
                            className={`${colorClass} text-white text-sm font-medium`}
                          >
                            {user.fullname[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator dot */}
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p className="font-medium">
                        {user.fullname}
                        {isCurrentUser && ' (You)'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </AnimatePresence>

          {/* Overflow indicator */}
          {remainingCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative z-0"
                  >
                    <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-background cursor-pointer hover:scale-110 transition-transform duration-200">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        +{remainingCount}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>{remainingCount} more {remainingCount === 1 ? 'person' : 'people'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* User names list */}
      <div className="space-y-1">
        {isAlone ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Only you are viewing this note</span>
          </motion.div>
        ) : (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">You</span>
            {otherUsers.length > 0 && (
              <span>
                {' and '}
                {otherUsers.slice(0, 2).map((u, i) => (
                  <span key={u.userId}>
                    <span className="font-medium text-foreground">{u.fullname.split(' ')[0]}</span>
                    {i < Math.min(otherUsers.length, 2) - 1 && ', '}
                  </span>
                ))}
                {otherUsers.length > 2 && (
                  <span> and {otherUsers.length - 2} more</span>
                )}
                {' are viewing'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const ActiveUsers = memo(ActiveUsersComponent);

