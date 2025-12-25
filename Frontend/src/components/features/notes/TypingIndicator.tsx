import { memo, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface TypingUser {
  userId: string;
  userFullname: string;
  timestamp: number;
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[];
}

function TypingIndicatorComponent({ typingUsers }: TypingIndicatorProps) {
  const [visibleUsers, setVisibleUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    // Filter users who typed in the last 3 seconds
    const now = Date.now();
    const active = typingUsers.filter(
      (user) => now - user.timestamp < 3000
    );
    setVisibleUsers(active);

    // Clean up old users
    const timer = setInterval(() => {
      const now = Date.now();
      const active = typingUsers.filter(
        (user) => now - user.timestamp < 3000
      );
      setVisibleUsers(active);
    }, 1000);

    return () => clearInterval(timer);
  }, [typingUsers]);

  if (visibleUsers.length === 0) return null;

  const getTypingText = () => {
    if (visibleUsers.length === 1) {
      return `${visibleUsers[0].userFullname} is typing...`;
    } else if (visibleUsers.length === 2) {
      return `${visibleUsers[0].userFullname} and ${visibleUsers[1].userFullname} are typing...`;
    } else {
      return `${visibleUsers[0].userFullname} and ${visibleUsers.length - 1} others are typing...`;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex items-center gap-2 text-sm text-muted-foreground px-4 py-2"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>{getTypingText()}</span>
      </motion.div>
    </AnimatePresence>
  );
}

export const TypingIndicator = memo(TypingIndicatorComponent);

