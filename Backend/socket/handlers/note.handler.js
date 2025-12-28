const NoteService = require('../../services/note.service');
const UserModel = require('../../models/user.model');
const UserPreferencesService = require('../../services/userPreferences.service');
const { socketRateLimit } = require('../middleware/rateLimit.middleware');

module.exports.handleJoinNote = async (socket, noteId, activeUsers, io) => {
  try {
    // Ensure noteId is a string for consistent room naming
    const noteIdStr = noteId.toString();
    
    // Join the room
    socket.join(noteIdStr);
    console.log(`Socket ${socket.id} joined room ${noteIdStr} for user ${socket.userId}`);

    const user = await UserModel.findById(socket.userId);
    if (!user) {
      console.error(`User not found for socket ${socket.id}, userId: ${socket.userId}`);
      return;
    }

    if (!activeUsers[noteIdStr]) {
      activeUsers[noteIdStr] = [];
    }

    activeUsers[noteIdStr] = activeUsers[noteIdStr].filter(
      (u) => u.socketId !== socket.id && u.userId.toString() !== socket.userId.toString()
    );

    activeUsers[noteIdStr].push({
      fullname: user.fullname,
      socketId: socket.id,
      userId: socket.userId,
    });

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    const activeUsersList = activeUsers[noteIdStr].map((u) => ({
      fullname: u.fullname,
      userId: u.userId.toString(),
    }));

    // Verify the room state matches activeUsers tracking
    const room = io.sockets.adapter.rooms.get(noteIdStr);
    const roomSize = room ? room.size : 0;
    if (roomSize !== activeUsersList.length) {
      console.warn(`Room size mismatch: room has ${roomSize} sockets but activeUsers has ${activeUsersList.length} users for note ${noteIdStr}`);
    }

    const eventData = {
      user: { fullname: user.fullname, userId: socket.userId.toString() },
      activeUsers: activeUsersList,
    };
    
    // Emit to all users in the room (including the joining user)
    // This ensures all clients have the same view of active users
    io.to(noteIdStr).emit('userJoined', eventData);
    console.log(`Emitted userJoined to room ${noteIdStr} with ${activeUsersList.length} active users: ${activeUsersList.map(u => u.fullname).join(', ')}`);

    // Also send notification to other users (not the joining user)
    if (preferences.notifications.joinLeave) {
      socket.to(noteIdStr).emit('notification', {
        type: 'userJoined',
        message: `${user.fullname} joined the note`,
        userId: socket.userId.toString(),
        userFullname: user.fullname,
        timestamp: Date.now()
      });
    }

    const note = await NoteService.getNoteById(noteId, socket.userId);
    if (note) {
      socket.emit('noteData', note);
    }
  } catch (error) {
    console.error('Error joining note room:', error);
    socket.emit('error', { message: 'Error joining note room' });
  }
};

module.exports.handleEditNote = async (socket, noteId, updatedFields, io) => {
  const rateLimit = socketRateLimit(socket, 'editNote');
  if (!rateLimit.allowed) {
    socket.emit('rateLimitExceeded', {
      message: 'Too many edit requests. Please slow down.',
      retryAfter: rateLimit.retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    });
    return;
  }

  try {
    // Ensure socket is in the room (join if not already joined)
    // This handles cases where editNote is emitted before joinNote completes
    const rooms = Array.from(socket.rooms);
    const noteIdStr = noteId.toString();
    if (!rooms.includes(noteIdStr)) {
      console.log(`Socket ${socket.id} not in room ${noteIdStr}, joining now...`);
      socket.join(noteIdStr);
    }

    // Update note using service (handles permissions and validation)
    const updatedNote = await NoteService.updateNote(noteId, updatedFields, socket.userId);
    if (!updatedNote) {
      socket.emit('error', { message: 'Note not found or unauthorized' });
      return;
    }

    const user = await UserModel.findById(socket.userId);
    if (!user) {
      console.error(`User not found for socket ${socket.id}, userId: ${socket.userId}`);
      return;
    }

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    // Emit liveEdit to other users only
    socket.to(noteIdStr).emit('liveEdit', {
      note: updatedNote,
      editor: { fullname: user.fullname, userId: socket.userId.toString() },
      timestamp: Date.now()
    });

    if (preferences.notifications.liveEdits) {
      socket.to(noteIdStr).emit('notification', {
        type: 'liveEdit',
        message: `${user.fullname} is editing the note`,
        userId: socket.userId.toString(),
        userFullname: user.fullname,
        timestamp: Date.now()
      });
    }

    // Emit noteUpdated to ALL users in the room (including sender)
    // This is the primary sync mechanism - full content updates
    // Include author metadata so frontend can differentiate save vs sync
    const room = io.sockets.adapter.rooms.get(noteIdStr);
    if (room) {
      console.log(`Broadcasting noteUpdated to ${room.size} users in room ${noteIdStr}`);
      io.to(noteIdStr).emit('noteUpdated', {
        ...updatedNote,
        savedBy: socket.userId.toString(),
        savedAt: updatedNote.updatedOn,
      });
    } else {
      console.warn(`Room ${noteIdStr} does not exist or is empty`);
      // Still emit to the sender as fallback
      socket.emit('noteUpdated', {
        ...updatedNote,
        savedBy: socket.userId.toString(),
        savedAt: updatedNote.updatedOn,
      });
    }
  } catch (error) {
    console.error('Error updating note:', error);
    socket.emit('error', { message: 'Error updating the note' });
  }
};

module.exports.handleLeaveNote = async (socket, noteId, activeUsers, io) => {
  const noteIdStr = noteId.toString();
  socket.leave(noteIdStr);

  // Clean up cursor position
  const cursorHandlers = require('./cursor.handler');
  await cursorHandlers.handleCursorCleanup(socket, noteIdStr, io);

  if (activeUsers[noteIdStr]) {
    const leavingUser = activeUsers[noteIdStr].find(
      (user) => user.socketId === socket.id
    );

    if (leavingUser) {
      activeUsers[noteIdStr] = activeUsers[noteIdStr].filter(
        (user) => user.socketId !== socket.id
      );

      const eventData = {
        user: { fullname: leavingUser.fullname, userId: leavingUser.userId.toString() },
        activeUsers: activeUsers[noteIdStr].map(u => ({ fullname: u.fullname, userId: u.userId.toString() }))
      };
      io.to(noteIdStr).emit('userLeft', eventData);

      io.to(noteIdStr).emit('notification', {
        type: 'userLeft',
        message: `${leavingUser.fullname} left the note`,
        userId: leavingUser.userId,
        userFullname: leavingUser.fullname,
        timestamp: Date.now()
      });
    }
  }
};

module.exports.handleDisconnect = async (socket, activeUsers, io) => {
  const cursorHandlers = require('./cursor.handler');
  
  for (const noteId in activeUsers) {
    const disconnectedUser = activeUsers[noteId].find(
      (user) => user.socketId === socket.id
    );

    if (disconnectedUser) {
      const noteIdStr = noteId.toString();
      // Clean up cursor position
      await cursorHandlers.handleCursorCleanup(socket, noteIdStr, io);
      
      activeUsers[noteId] = activeUsers[noteId].filter(
        (user) => user.socketId !== socket.id
      );

      if (activeUsers[noteId].length === 0) {
        delete activeUsers[noteId];
      } else {
        io.to(noteIdStr).emit('userLeft', {
          user: { fullname: disconnectedUser.fullname, userId: disconnectedUser.userId.toString() },
          activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId.toString() }))
        });

        io.to(noteIdStr).emit('notification', {
          type: 'userLeft',
          message: `${disconnectedUser.fullname} disconnected`,
          userId: disconnectedUser.userId,
          userFullname: disconnectedUser.fullname,
          timestamp: Date.now()
        });
      }
    }
  }
};

