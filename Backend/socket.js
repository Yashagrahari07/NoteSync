const jwt = require('jsonwebtoken');
const { userModel } = require('./models/user.model');
const NoteService = require('./services/note.service');

module.exports.setupSocket = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded._id);
      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);

    socket.on('joinNote', async (noteId) => {
      try {
        const note = await NoteService.getNoteById(noteId, socket.user._id);
        if (!note) {
          socket.emit('error', { message: 'Note not found or unauthorized' });
          return;
        }

        socket.join(noteId);
        console.log(`${socket.user.username} joined note ${noteId}`);

        if (!note.collaborators.includes(socket.user._id)) {
          note.collaborators.push(socket.user._id);
          await note.save();
        }

        socket.to(noteId).emit('userJoined', socket.user.username);

      } catch (err) {
        socket.emit('error', { message: 'Error joining note room' });
      }
    });

    socket.on('editNote', async (noteId, content) => {
      try {
        const note = await NoteService.getNoteById(noteId, socket.user._id);
        if (!note) {
          socket.emit('error', { message: 'Note not found or unauthorized' });
          return;
        }

        note.content = content;
        note.updatedOn = Date.now();
        await note.save();

        io.to(noteId).emit('noteUpdated', note);

      } catch (err) {
        socket.emit('error', { message: 'Error updating the note' });
      }
    });

    socket.on('leaveNote', (noteId) => {
      socket.leave(noteId);
      console.log(`${socket.user.username} left note ${noteId}`);

      socket.to(noteId).emit('userLeft', socket.user.username);
    });

    socket.on('disconnect', () => {
      console.log(`${socket.user.username} disconnected`);
    });
  });
};