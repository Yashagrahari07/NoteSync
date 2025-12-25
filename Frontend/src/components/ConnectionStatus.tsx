import { useEffect, useState } from 'react';
import { getSocketClient } from '@/lib/socketClient';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const socket = getSocketClient();
    if (!socket) return;

    const updateStatus = () => setIsConnected(socket.connected);
    
    socket.on('connect', updateStatus);
    socket.on('disconnect', updateStatus);
    socket.on('reconnect', updateStatus);
    socket.on('reconnect_attempt', () => setIsConnected(false));
    socket.on('reconnect_failed', () => setIsConnected(false));

    // Initial status
    updateStatus();

    return () => {
      socket.off('connect', updateStatus);
      socket.off('disconnect', updateStatus);
      socket.off('reconnect', updateStatus);
      socket.off('reconnect_attempt', updateStatus);
      socket.off('reconnect_failed', updateStatus);
    };
  }, []);

  if (isConnected) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Badge variant="destructive" className="gap-2">
          <WifiOff className="h-3 w-3" />
          Reconnecting...
        </Badge>
      </motion.div>
    </AnimatePresence>
  );
}

