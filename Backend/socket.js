const jwt = require('jsonwebtoken');
const NoteService = require('./services/note.service');
const UserModel = require('./models/user.model');

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
        activeUsers[noteId].push({ fullname: user.fullname, socketId: socket.id });

        io.to(noteId).emit('activeUsers', activeUsers[noteId]);

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

        Object.assign(note, updatedFields);
        note.updatedOn = Date.now();
        await note.save();

        io.to(noteId).emit('noteUpdated', note);
      } catch (err) {
        socket.emit('error', { message: 'Error updating the note' });
      }
    });

    socket.on('leaveNote', (noteId) => {
      socket.leave(noteId);

      if (activeUsers[noteId]) {
        activeUsers[noteId] = activeUsers[noteId].filter(
          (user) => user.socketId !== socket.id
        );

        io.to(noteId).emit('activeUsers', activeUsers[noteId]);
      }
    });

    socket.on('disconnect', () => {
      for (const noteId in activeUsers) {
        activeUsers[noteId] = activeUsers[noteId].filter(
          (user) => user.socketId !== socket.id
        );

        io.to(noteId).emit('activeUsers', activeUsers[noteId]);
      }
    });
  });
};