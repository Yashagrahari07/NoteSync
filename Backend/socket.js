const jwt = require('jsonwebtoken');
const NoteService = require('./services/note.service');
const UserModel = require('./models/user.model');
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
        if (!user) return;

        if (!activeUsers[noteId]) {
          activeUsers[noteId] = [];
        }
        activeUsers[noteId].push({ 
          fullname: user.fullname, 
          socketId: socket.id,
          userId: socket.userId 
        });

        // Emit user joined event to all users in the room
        io.to(noteId).emit('userJoined', {
          user: { fullname: user.fullname, userId: socket.userId },
          activeUsers: activeUsers[noteId]
        });

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

        // Emit live edit event with user information
        io.to(noteId).emit('liveEdit', {
          note: note,
          editor: { fullname: user.fullname, userId: socket.userId },
          timestamp: Date.now()
        });

        // Also emit the regular noteUpdated event for backward compatibility
        io.to(noteId).emit('noteUpdated', note);
      } catch (err) {
        socket.emit('error', { message: 'Error updating the note' });
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

        // Emit to all users in the room
        io.to(noteId).emit('collaboratorAdded', {
          note: note,
          collaborator: collaboratorData,
          timestamp: Date.now()
        });
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

        // Emit to all users in the room
        io.to(noteId).emit('collaboratorRemoved', {
          note: note,
          collaborator: collaboratorData,
          timestamp: Date.now()
        });
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

        activeUsers[noteId] = activeUsers[noteId].filter(
          (user) => user.socketId !== socket.id
        );

        // Emit user left event to all users in the room
        if (leavingUser) {
          io.to(noteId).emit('userLeft', {
            user: { fullname: leavingUser.fullname, userId: leavingUser.userId },
            activeUsers: activeUsers[noteId]
          });
        }
      }
    });

    socket.on('disconnect', async () => {
      for (const noteId in activeUsers) {
        const disconnectedUser = activeUsers[noteId].find(
          (user) => user.socketId === socket.id
        );

        activeUsers[noteId] = activeUsers[noteId].filter(
          (user) => user.socketId !== socket.id
        );

        // Emit user left event for disconnected users
        if (disconnectedUser) {
          io.to(noteId).emit('userLeft', {
            user: { fullname: disconnectedUser.fullname, userId: disconnectedUser.userId },
            activeUsers: activeUsers[noteId]
          });
        }
      }
    });
  });
};