const NoteService = require('../../services/note.service');
const UserModel = require('../../models/user.model');
const UserPreferencesService = require('../../services/userPreferences.service');
const { socketRateLimit } = require('../middleware/rateLimit.middleware');

module.exports.handleJoinNote = async (socket, noteId, activeUsers, io) => {
  try {
    socket.join(noteId);

    const user = await UserModel.findById(socket.userId);
    if (!user) return;

    if (!activeUsers[noteId]) {
      activeUsers[noteId] = [];
    }

    activeUsers[noteId] = activeUsers[noteId].filter(
      (u) => u.socketId !== socket.id && u.userId.toString() !== socket.userId.toString()
    );

    activeUsers[noteId].push({
      fullname: user.fullname,
      socketId: socket.id,
      userId: socket.userId,
    });

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    const eventData = {
      user: { fullname: user.fullname, userId: socket.userId },
      activeUsers: activeUsers[noteId].map((u) => ({
        fullname: u.fullname,
        userId: u.userId,
      })),
    };
    io.to(noteId).emit('userJoined', eventData);

    if (preferences.notifications.joinLeave) {
      socket.to(noteId).emit('notification', {
        type: 'userJoined',
        message: `${user.fullname} joined the note`,
        userId: socket.userId,
        userFullname: user.fullname,
        timestamp: Date.now()
      });
    }

    const note = await NoteService.getNoteById(noteId, socket.userId);
    if (note) {
      socket.emit('noteData', note);
    }
  } catch (error) {
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
    const note = await NoteService.getNoteById(noteId, socket.userId);
    if (!note) {
      socket.emit('error', { message: 'Note not found' });
      return;
    }

    const user = await UserModel.findById(socket.userId);
    if (!user) return;

    Object.assign(note, updatedFields);
    note.updatedOn = Date.now();
    await note.save();

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    socket.to(noteId).emit('liveEdit', {
      note: note,
      editor: { fullname: user.fullname, userId: socket.userId },
      timestamp: Date.now()
    });

    if (preferences.notifications.liveEdits) {
      socket.to(noteId).emit('notification', {
        type: 'liveEdit',
        message: `${user.fullname} is editing the note`,
        userId: socket.userId,
        userFullname: user.fullname,
        timestamp: Date.now()
      });
    }

    socket.to(noteId).emit('noteUpdated', note);
  } catch (error) {
    socket.emit('error', { message: 'Error updating the note' });
  }
};

module.exports.handleLeaveNote = async (socket, noteId, activeUsers, io) => {
  socket.leave(noteId);

  if (activeUsers[noteId]) {
    const leavingUser = activeUsers[noteId].find(
      (user) => user.socketId === socket.id
    );

    if (leavingUser) {
      activeUsers[noteId] = activeUsers[noteId].filter(
        (user) => user.socketId !== socket.id
      );

      const eventData = {
        user: { fullname: leavingUser.fullname, userId: leavingUser.userId },
        activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId }))
      };
      io.to(noteId).emit('userLeft', eventData);

      io.to(noteId).emit('notification', {
        type: 'userLeft',
        message: `${leavingUser.fullname} left the note`,
        userId: leavingUser.userId,
        userFullname: leavingUser.fullname,
        timestamp: Date.now()
      });
    }
  }
};

module.exports.handleDisconnect = (socket, activeUsers, io) => {
  for (const noteId in activeUsers) {
    const disconnectedUser = activeUsers[noteId].find(
      (user) => user.socketId === socket.id
    );

    if (disconnectedUser) {
      activeUsers[noteId] = activeUsers[noteId].filter(
        (user) => user.socketId !== socket.id
      );

      if (activeUsers[noteId].length === 0) {
        delete activeUsers[noteId];
      } else {
        io.to(noteId).emit('userLeft', {
          user: { fullname: disconnectedUser.fullname, userId: disconnectedUser.userId },
          activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId }))
        });

        io.to(noteId).emit('notification', {
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

