import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { getSocketClient } from '@/lib/socketClient';
import { useAuthStore } from '@/stores/auth.store';
import type { Note } from '@/types/note.types';
import { toast } from 'sonner';

export interface Operation {
  type: 'insert' | 'delete';
  position: number;
  content: string;
  userId: string;
  timestamp: number;
  version?: number;
}

export interface CursorPosition {
  userId: string;
  userFullname: string;
  position: number;
  timestamp: number;
}

interface ActiveUser {
  userId: string;
  fullname: string;
}

interface TypingUser {
  userId: string;
  userFullname: string;
  timestamp: number;
}

interface NoteEditingState {
  // Note data
  noteId: string | null;
  note: Note | null;
  title: string;
  content: string;
  previousContent: string; // For operation generation
  description: string;
  tags: string[];
  isPinned: boolean;
  
  // Real-time collaboration
  activeUsers: ActiveUser[];
  typingUsers: TypingUser[];
  cursorPositions: Map<string, CursorPosition>;
  
  // Socket connection
  socket: Socket | null;
  isConnected: boolean;
  
  // Actions - Note data
  setNote: (note: Note) => void;
  updateTitle: (title: string) => void;
  updateContent: (content: string, emitOperation?: boolean) => void;
  updateDescription: (description: string) => void;
  updateTags: (tags: string[]) => void;
  togglePin: () => void;
  
  // Actions - Socket
  initializeSocket: (noteId: string) => void;
  cleanupSocket: () => void;
  emitOperation: (operation: Operation) => void;
  emitCursorMove: (position: number) => void;
  emitTypingStart: () => void;
  emitTypingStop: () => void;
  
  // Actions - Event handlers
  handleUserJoined: (data: { user: { userId: string; fullname: string }; activeUsers: ActiveUser[] }) => void;
  handleUserLeft: (data: { user: { userId: string; fullname: string }; activeUsers: ActiveUser[] }) => void;
  handleUserTyping: (data: { userId: string; userFullname: string; timestamp: number }) => void;
  handleUserStoppedTyping: (data: { userId: string; timestamp: number }) => void;
  handleOperationApplied: (data: { operation: Operation; updatedContent: string; timestamp: number }) => void;
  handleNoteUpdated: (data: { title?: string; content?: string; description?: string; tags?: string[]; savedBy?: string; savedAt?: string | Date | number }) => void;
  handleCursorMoved: (data: { userId: string; userFullname: string; position: number; timestamp: number }) => void;
  handleNoteData: (data: Note) => void;
}

// Note: Operation-based sync is disabled due to HTML/plain-text position mismatch issues.
// Using full content sync instead, which is reliable for HTML content.

// Event deduplication system to prevent processing same event multiple times
class EventDeduplicator {
  private processedEvents: Map<string, number> = new Map();
  private readonly TTL_MS = 2000; // 2 seconds deduplication window

  isDuplicate(signature: string): boolean {
    const now = Date.now();
    const lastProcessed = this.processedEvents.get(signature);

    if (lastProcessed && (now - lastProcessed) < this.TTL_MS) {
      return true;
    }

    this.processedEvents.set(signature, now);
    this.cleanup(now);
    return false;
  }

  private cleanup(now: number) {
    // Remove entries older than TTL to prevent memory leaks
    for (const [key, timestamp] of this.processedEvents.entries()) {
      if (now - timestamp > this.TTL_MS * 2) {
        this.processedEvents.delete(key);
      }
    }
  }

  clear() {
    this.processedEvents.clear();
  }
}

export const useNoteEditingStore = create<NoteEditingState>((set, get) => {
  let cursorUpdateTimer: NodeJS.Timeout | null = null;
  let typingTimeout: NodeJS.Timeout | null = null;
  let currentNoteId: string | null = null;
  let listenersSetup = false;
  let connectOnceHandler: (() => void) | null = null;
  const eventDeduplicator = new EventDeduplicator();
  
  // Helper to remove all event listeners from socket
  const removeAllListeners = (socket: Socket) => {
    const events = [
      'connect',
      'disconnect',
      'userJoined',
      'userLeft',
      'userTyping',
      'userStoppedTyping',
      'operationApplied',
      'noteUpdated',
      'cursorMoved',
      'cursorRemoved',
      'noteData'
    ];
    events.forEach(event => {
      socket.removeAllListeners(event);
    });
    
    if (connectOnceHandler) {
      socket.off('connect', connectOnceHandler);
      connectOnceHandler = null;
    }
    
    listenersSetup = false;
  };
  
  // Generate unique event signature for deduplication
  const getEventSignature = (
    eventType: string,
    userId: string,
    noteId: string | null,
    timestamp?: number
  ): string => {
    const ts = timestamp || Date.now();
    return `${eventType}:${userId}:${noteId || 'unknown'}:${Math.floor(ts / 1000)}`;
  };
  
  return {
    // Initial state
    noteId: null,
    note: null,
    title: '',
    content: '',
    previousContent: '',
    description: '',
    tags: [],
    isPinned: false,
    activeUsers: [],
    typingUsers: [],
    cursorPositions: new Map(),
    socket: null,
    isConnected: false,
    
    // Set note data
    setNote: (note: Note) => {
      set({
        note,
        noteId: note._id,
        title: note.title || '',
        content: note.content || '',
        previousContent: note.content || '',
        description: note.description || '',
        tags: note.tags || [],
        isPinned: note.isPinned || false,
      });
    },
    
    updateTitle: (title: string) => {
      set({ title });
      const { socket, noteId } = get();
      if (socket && noteId) {
        socket.emit('editNote', noteId, { title });
      }
    },
    
    updateContent: (content: string, emitOperation = true) => {
      const { previousContent, socket, noteId, isConnected } = get();
      
      // Check content change before updating state to prevent false negatives
      const contentChanged = previousContent !== content;
      
      // Only update previousContent when emitting to prevent race conditions
      // This allows subsequent calls to detect changes correctly
      if (contentChanged) {
        if (emitOperation) {
          set({ content, previousContent: content });
        } else {
          set({ content });
        }
      }
      
      // Emit WebSocket event for real-time collaboration
      if (emitOperation && contentChanged && socket && noteId && isConnected) {
        socket.emit('editNote', noteId, { content });
      }
    },
    
    updateDescription: (description: string) => {
      set({ description });
      const { socket, noteId } = get();
      if (socket && noteId) {
        socket.emit('editNote', noteId, { description });
      }
    },
    
    updateTags: (tags: string[]) => {
      set({ tags });
      const { socket, noteId } = get();
      if (socket && noteId) {
        socket.emit('editNote', noteId, { tags });
      }
    },
    
    togglePin: () => {
      const { isPinned } = get();
      set({ isPinned: !isPinned });
    },
    
    initializeSocket: (noteId: string) => {
      const { token } = useAuthStore.getState();
      if (!token) return;
      
      const socket = getSocketClient(token);
      if (!socket) return;
      
      // Prevent duplicate initialization for the same noteId
      if (currentNoteId === noteId && listenersSetup) {
        return;
      }
      
      // If noteId changed or socket instance changed, clean up previous listeners
      if (currentNoteId !== null && (currentNoteId !== noteId || listenersSetup)) {
        removeAllListeners(socket);
      }
      
      currentNoteId = noteId;
      set({ socket, noteId, isConnected: socket.connected });
      
      if (socket.connected) {
        socket.emit('joinNote', noteId);
      }
      
      const setupListeners = () => {
        // Remove any existing listeners before adding new ones (defensive)
        removeAllListeners(socket);
        
        socket.on('connect', () => {
          set({ isConnected: true });
          socket.emit('joinNote', noteId);
        });
        
        socket.on('disconnect', () => {
          set({ isConnected: false });
        });
        
        socket.on('userJoined', (data) => {
          get().handleUserJoined(data);
        });
        
        socket.on('userLeft', (data) => {
          get().handleUserLeft(data);
        });
        
        socket.on('userTyping', (data) => {
          get().handleUserTyping(data);
        });
        
        socket.on('userStoppedTyping', (data) => {
          get().handleUserStoppedTyping(data);
        });
        
        socket.on('operationApplied', (data) => {
          get().handleOperationApplied(data);
        });
        
        socket.on('noteUpdated', (data) => {
          get().handleNoteUpdated(data);
        });
        
        socket.on('cursorMoved', (data) => {
          get().handleCursorMoved(data);
        });
        
        socket.on('cursorRemoved', (data: { userId: string; timestamp: number }) => {
          const { cursorPositions } = get();
          const newCursors = new Map(cursorPositions);
          newCursors.delete(data.userId);
          set({ cursorPositions: newCursors });
        });
        
        socket.on('noteData', (data) => {
          get().handleNoteData(data);
        });
        
        listenersSetup = true;
      };
      
      if (socket.connected) {
        setupListeners();
      } else {
        // Remove any existing connect handler before adding new one
        if (connectOnceHandler) {
          socket.off('connect', connectOnceHandler);
        }
        connectOnceHandler = setupListeners;
        socket.once('connect', connectOnceHandler);
      }
    },
    
    cleanupSocket: () => {
      const { socket, noteId } = get();
      
      if (socket) {
        removeAllListeners(socket);
        
        if (noteId) {
          socket.emit('leaveNote', noteId);
        }
      }
      
      eventDeduplicator.clear();
      currentNoteId = null;
      set({ socket: null, isConnected: false, noteId: null });
    },
    
    // Emit operation
    emitOperation: (operation: Operation) => {
      const { socket, noteId } = get();
      if (socket && noteId) {
        socket.emit('applyOperation', noteId, operation);
      }
    },
    
    // Emit cursor move (throttled)
    emitCursorMove: (position: number) => {
      const { socket, noteId, note } = get();
      if (!socket || !noteId) return;
      
      // Throttle cursor updates (max 10 per second)
      if (cursorUpdateTimer) {
        clearTimeout(cursorUpdateTimer);
      }
      
      cursorUpdateTimer = setTimeout(() => {
        const userId = note?.userId || useAuthStore.getState().user?._id || '';
        const userFullname = useAuthStore.getState().user?.fullname || 'Unknown';
        
        socket.emit('cursorMove', noteId, {
          userId,
          userFullname,
          position,
          timestamp: Date.now(),
        });
      }, 100);
    },
    
    emitTypingStart: () => {
      const { socket, noteId, isConnected } = get();
      if (!socket || !noteId || !isConnected) return;
      
      socket.emit('typingStart', noteId);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      typingTimeout = setTimeout(() => {
        get().emitTypingStop();
      }, 2000);
    },
    
    // Emit typing stop
    emitTypingStop: () => {
      const { socket, noteId } = get();
      if (socket && noteId) {
        socket.emit('typingStop', noteId);
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
    },
    
    handleUserJoined: (data) => {
      const { noteId } = get();
      const currentUserId = useAuthStore.getState().user?._id?.toString();
      const joiningUserId = data.user.userId?.toString();
      
      if (!joiningUserId || !noteId) return;
      
      // Event deduplication: process each unique event only once
      // Use activeUsers array hash to detect actual state changes
      const activeUsersHash = JSON.stringify(data.activeUsers);
      const eventSignature = getEventSignature('userJoined', joiningUserId, noteId);
      const stateSignature = `${eventSignature}:${activeUsersHash}`;
      
      if (eventDeduplicator.isDuplicate(stateSignature)) {
        return;
      }
      
      // Trust server-provided activeUsers list completely
      // Backend is the single source of truth and includes all users
      const { activeUsers: currentActiveUsers } = get();
      const serverActiveUsers = [...data.activeUsers];
      
      // Only update state if it actually changed (idempotent check)
      const usersChanged = JSON.stringify(currentActiveUsers) !== JSON.stringify(serverActiveUsers);
      if (usersChanged) {
        set({ activeUsers: serverActiveUsers });
      }
      
      // Show toast only for other users (not self)
      if (joiningUserId !== currentUserId) {
        console.log(`User joined note: ${data.user.fullname} (${joiningUserId})`);
        toast.success(`${data.user.fullname} joined the note`, { duration: 2000 });
      }
    },
    
    handleUserLeft: (data) => {
      const { noteId, activeUsers: currentActiveUsers, cursorPositions: currentCursors } = get();
      const currentUserId = useAuthStore.getState().user?._id?.toString();
      const leavingUserId = data.user.userId?.toString();
      
      if (!leavingUserId || !noteId) return;
      
      // Event deduplication: process each unique event only once
      // Use activeUsers array hash to detect actual state changes
      const activeUsersHash = JSON.stringify(data.activeUsers);
      const eventSignature = getEventSignature('userLeft', leavingUserId, noteId);
      const stateSignature = `${eventSignature}:${activeUsersHash}`;
      
      if (eventDeduplicator.isDuplicate(stateSignature)) {
        return;
      }
      
      // Trust server-provided activeUsers list completely
      // Backend is the single source of truth and includes all remaining users
      const serverActiveUsers = [...data.activeUsers];
      
      // Only update state if it actually changed (idempotent check)
      const usersChanged = JSON.stringify(currentActiveUsers) !== JSON.stringify(serverActiveUsers);
      if (usersChanged) {
        set({ activeUsers: serverActiveUsers });
      }
      
      // Remove cursor for leaving user (idempotent - safe to call multiple times)
      if (currentCursors.has(leavingUserId)) {
        const newCursors = new Map(currentCursors);
        newCursors.delete(leavingUserId);
        set({ cursorPositions: newCursors });
      }
      
      // Show toast only for other users (not self)
      if (leavingUserId !== currentUserId) {
        console.log(`User left note: ${data.user.fullname} (${leavingUserId})`);
        toast.info(`${data.user.fullname} left the note`, { duration: 2000 });
      }
    },
    
    handleUserTyping: (data) => {
      const currentUserId = useAuthStore.getState().user?._id?.toString();
      if (data.userId?.toString() === currentUserId) return;
      
      set((state) => {
        const filtered = state.typingUsers.filter((u) => u.userId !== data.userId);
        return { typingUsers: [...filtered, data] };
      });
    },
    
    handleUserStoppedTyping: (data) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter((u) => u.userId !== data.userId),
      }));
    },
    
    handleOperationApplied: (data) => {
      // Reserved for future HTML-aware operation support
      if (data.updatedContent !== undefined && data.updatedContent !== null) {
        const { content: currentContent } = get();
        if (data.updatedContent !== currentContent) {
          set({ 
            content: data.updatedContent, 
            previousContent: data.updatedContent 
          });
        }
      }
    },
    
    handleNoteUpdated: (data) => {
      const { content: currentContent, previousContent: currentPreviousContent } = get();
      
      if (data.title !== undefined && data.title !== null) {
        set({ title: data.title });
      }
      
      // Sync content from server (single source of truth for real-time collaboration)
      if (data.content !== undefined && data.content !== null) {
        if (data.content !== currentContent) {
          set({ content: data.content, previousContent: data.content });
        } else if (currentPreviousContent !== data.content) {
          set({ previousContent: data.content });
        }
      }
      
      if (data.description !== undefined && data.description !== null) {
        set({ description: data.description });
      }
      if (data.tags !== undefined && data.tags !== null) {
        set({ tags: data.tags });
      }
    },
    
    handleCursorMoved: (data) => {
      const currentUserId = useAuthStore.getState().user?._id?.toString();
      if (data.userId?.toString() === currentUserId) return;
      
      set((state) => {
        const newCursors = new Map(state.cursorPositions);
        newCursors.set(data.userId, {
          userId: data.userId,
          userFullname: data.userFullname,
          position: data.position,
          timestamp: data.timestamp,
        });
        return { cursorPositions: newCursors };
      });
    },
    
    handleNoteData: (data) => {
      // Initial note data when joining
      get().setNote(data);
    },
  };
});

