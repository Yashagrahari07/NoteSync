const jwt = require('jsonwebtoken');
const NoteService = require('./services/note.service');
const UserModel = require('./models/user.model');
const UserPreferencesService = require('./services/userPreferences.service');
const NotificationService = require('./services/notification.service');

const activeUsers = {};

module.exports.setupSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    const token = socket.handshake.auth?.token;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded._id || decoded.id;
      } catch (err) {
        socket.emit('error', { message: 'Authentication failed' });
        socket.disconnect();
        return;
      }
    } else {
      socket.emit('error', { message: 'Authentication required' });
      socket.disconnect();
      return;
    }

        socket.on('joinNote', async (noteId) => {
      try {
        socket.join(noteId);

        const user = await UserModel.findById(socket.userId);
        if (!user) {
          return;
        }

        if (!activeUsers[noteId]) {
          activeUsers[noteId] = [];
        }

        // Check if user is already in the room
        const existingUserIndex = activeUsers[noteId].findIndex(
          activeUser => activeUser.userId === socket.userId
        );

        if (existingUserIndex !== -1) {
          // User is already in the room - do nothing
          return;
        }

        // Add new user to the room
        activeUsers[noteId].push({
          fullname: user.fullname,
          socketId: socket.id,
          userId: socket.userId
        });

        // Get user preferences for notification settings
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

        // Emit user joined event to all users in the room
        const eventData = {
          user: { fullname: user.fullname, userId: socket.userId },
          activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId }))
        };
        io.to(noteId).emit('userJoined', eventData);

        // Send notification to other users
        if (preferences.notifications.joinLeave) {
          socket.to(noteId).emit('notification', {
            type: 'userJoined',
            message: `${user.fullname} joined the note`,
            userId: socket.userId,
            userFullname: user.fullname,
            timestamp: Date.now()
          });
        }

        // Get note data for the user
        const note = await NoteService.getNoteById(noteId, socket.userId);
        if (note) {
          socket.emit('noteData', note);
        }
      } catch (err) {
        socket.emit('error', { message: 'Error joining note room' });
      }
    });

    socket.on('editNote', async (noteId, updatedFields) => {
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

        // Get user preferences for live edit notifications
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

        // Emit live edit event with user information
        io.to(noteId).emit('liveEdit', {
          note: note,
          editor: { fullname: user.fullname, userId: socket.userId },
          timestamp: Date.now()
        });

        // Send live edit notification if enabled
        if (preferences.notifications.liveEdits) {
          socket.to(noteId).emit('notification', {
            type: 'liveEdit',
            message: `${user.fullname} is editing the note`,
            userId: socket.userId,
            userFullname: user.fullname,
            timestamp: Date.now()
          });
        }

        // Also emit the regular noteUpdated event for backward compatibility
        io.to(noteId).emit('noteUpdated', note);
      } catch (err) {
        socket.emit('error', { message: 'Error updating the note' });
      }
    });

    // Phase 1: Enhanced real-time collaboration events
    socket.on('cursorMove', async (noteId, cursorData) => {
      try {
        const user = await UserModel.findById(socket.userId);
        if (!user) return;

        // Get user preferences for cursor visibility
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);
        
        if (preferences.realTime.showCursors) {
          // Broadcast cursor position to other users
          socket.to(noteId).emit('cursorMoved', {
            userId: socket.userId,
            userFullname: user.fullname,
            cursor: cursorData,
            timestamp: Date.now()
          });
        }

        // Update cursor position in note document
        const note = await NoteService.getNoteById(noteId, socket.userId);
        if (note) {
          // Remove old cursor position for this user
          note.cursorPositions = note.cursorPositions.filter(
            pos => pos.userId.toString() !== socket.userId
          );
          
          // Add new cursor position
          note.cursorPositions.push({
            userId: socket.userId,
            userFullname: user.fullname,
            position: cursorData,
            timestamp: Date.now()
          });
          
          await note.save();
        }
      } catch (err) {
        console.error('Error handling cursor move:', err);
      }
    });

    socket.on('selectionChange', async (noteId, selectionData) => {
      try {
        const user = await UserModel.findById(socket.userId);
        if (!user) return;

        // Get user preferences for selection visibility
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);
        
        if (preferences.realTime.showSelections) {
          // Broadcast selection change to other users
          socket.to(noteId).emit('selectionChanged', {
            userId: socket.userId,
            userFullname: user.fullname,
            selection: selectionData,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error('Error handling selection change:', err);
      }
    });

    socket.on('typingStart', async (noteId) => {
      try {
        const user = await UserModel.findById(socket.userId);
        if (!user) return;

        // Broadcast typing indicator to other users
        socket.to(noteId).emit('userTyping', {
          userId: socket.userId,
          userFullname: user.fullname,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Error handling typing start:', err);
      }
    });

    socket.on('typingStop', async (noteId) => {
      try {
        // Broadcast typing stop to other users
        socket.to(noteId).emit('userStoppedTyping', {
          userId: socket.userId,
          timestamp: Date.now()
        });
      } catch (err) {
        console.error('Error handling typing stop:', err);
      }
    });

    // Handle collaborator added event
    socket.on('collaboratorAdded', async (noteId, collaboratorData) => {
      try {
        const note = await NoteService.getNoteById(noteId, socket.userId);
        if (!note) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }

        const user = await UserModel.findById(socket.userId);
        if (!user) return;

        // Get user preferences for collaborator change notifications
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

        // Emit to all users in the room
        io.to(noteId).emit('collaboratorAdded', {
          note: note,
          collaborator: collaboratorData,
          timestamp: Date.now()
        });

        // Send notification if enabled
        if (preferences.notifications.collaboratorChanges) {
          io.to(noteId).emit('notification', {
            type: 'collaboratorAdded',
            message: `${collaboratorData.fullname} was added as a collaborator`,
            userId: collaboratorData.userId,
            userFullname: collaboratorData.fullname,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Error handling collaborator addition' });
      }
    });

    // Handle collaborator removed event
    socket.on('collaboratorRemoved', async (noteId, collaboratorData) => {
      try {
        const note = await NoteService.getNoteById(noteId, socket.userId);
        if (!note) {
          socket.emit('error', { message: 'Note not found' });
          return;
        }

        const user = await UserModel.findById(socket.userId);
        if (!user) return;

        // Get user preferences for collaborator change notifications
        const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

        // Emit to all users in the room
        io.to(noteId).emit('collaboratorRemoved', {
          note: note,
          collaborator: collaboratorData,
          timestamp: Date.now()
        });

        // Send notification if enabled
        if (preferences.notifications.collaboratorChanges) {
          io.to(noteId).emit('notification', {
            type: 'collaboratorRemoved',
            message: `${collaboratorData.fullname} was removed as a collaborator`,
            userId: collaboratorData.userId,
            userFullname: collaboratorData.fullname,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        socket.emit('error', { message: 'Error handling collaborator removal' });
      }
    });

    socket.on('leaveNote', async (noteId) => {
      socket.leave(noteId);

      if (activeUsers[noteId]) {
        const leavingUser = activeUsers[noteId].find(
          (user) => user.socketId === socket.id
        );

        if (leavingUser) {
          // Remove user from active users
          activeUsers[noteId] = activeUsers[noteId].filter(
            (user) => user.socketId !== socket.id
          );

          // Emit user left event to all users in the room
          const eventData = {
            user: { fullname: leavingUser.fullname, userId: leavingUser.userId },
            activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId }))
          };
          io.to(noteId).emit('userLeft', eventData);

          // Send notification to other users
          io.to(noteId).emit('notification', {
            type: 'userLeft',
            message: `${leavingUser.fullname} left the note`,
            userId: leavingUser.userId,
            userFullname: leavingUser.fullname,
            timestamp: Date.now()
          });
        }
      }
    });

    socket.on('disconnect', async () => {
      // Remove user from all rooms they were in
      for (const noteId in activeUsers) {
        const disconnectedUser = activeUsers[noteId].find(
          (user) => user.socketId === socket.id
        );

        if (disconnectedUser) {
          // Remove user from active users
          activeUsers[noteId] = activeUsers[noteId].filter(
            (user) => user.socketId !== socket.id
          );

          // Emit user left event for disconnected users
          io.to(noteId).emit('userLeft', {
            user: { fullname: disconnectedUser.fullname, userId: disconnectedUser.userId },
            activeUsers: activeUsers[noteId].map(u => ({ fullname: u.fullname, userId: u.userId }))
          });

          // Send notification to other users
          io.to(noteId).emit('notification', {
            type: 'userLeft',
            message: `${disconnectedUser.fullname} disconnected`,
            userId: disconnectedUser.userId,
            userFullname: disconnectedUser.fullname,
            timestamp: Date.now()
          });
        }
      }
    });
  });
};