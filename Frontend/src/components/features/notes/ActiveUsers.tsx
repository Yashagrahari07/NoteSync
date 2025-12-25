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
    <div className="flex items-center gap-2 px-2">
      <span className="text-xs text-muted-foreground mr-2">Active:</span>
      <div className="flex -space-x-2">
        {users.map((user) => (
          <TooltipProvider key={user.userId}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-7 w-7 border-2 border-background hover:border-primary/50 transition-colors">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user.fullname[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {user.fullname}
                  {user.userId === currentUserId && ' (You)'}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}

export const ActiveUsers = memo(ActiveUsersComponent);

