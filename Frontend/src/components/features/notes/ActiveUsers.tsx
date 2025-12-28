import { memo } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ActiveUser {
  userId: string;
  fullname: string;
}

interface ActiveUsersProps {
  users: ActiveUser[];
  currentUserId?: string;
}

function ActiveUsersComponent({ users, currentUserId }: ActiveUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-muted-foreground">Active Users</p>
      <div className="flex flex-wrap gap-2">
        {users.map((user) => (
          <TooltipProvider key={user.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8 border-2 border-background hover:border-primary/50 transition-all duration-200 hover:scale-110">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {user.fullname[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-foreground truncate max-w-[120px]">
                    {user.fullname}
                    {user.userId === currentUserId && ' (You)'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{user.fullname}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export const ActiveUsers = memo(ActiveUsersComponent);

