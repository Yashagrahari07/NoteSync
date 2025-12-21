const { Server } = require('socket.io');
const { socketAuth } = require('./socket/middleware/auth.middleware');
const noteHandlers = require('./socket/handlers/note.handler');
const collaborationHandlers = require('./socket/handlers/collaboration.handler');
const conflictHandlers = require('./socket/handlers/conflict.handler');

const activeUsers = {};

module.exports.setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6,
    allowEIO3: false,
    upgradeTimeout: 10000,
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {

    socket.on('joinNote', (noteId) => {
      setImmediate(() => noteHandlers.handleJoinNote(socket, noteId, activeUsers, io));
    });
    
    socket.on('editNote', (noteId, updatedFields) => {
      setImmediate(() => noteHandlers.handleEditNote(socket, noteId, updatedFields, io));
    });
    
    socket.on('leaveNote', (noteId) => {
      setImmediate(() => noteHandlers.handleLeaveNote(socket, noteId, activeUsers, io));
    });



    socket.on('typingStart', (noteId) => {
      setImmediate(() => collaborationHandlers.handleTypingStart(socket, noteId, io));
    });
    
    socket.on('typingStop', (noteId) => {
      setImmediate(() => collaborationHandlers.handleTypingStop(socket, noteId, io));
    });

    socket.on('collaboratorAdded', (noteId, collaboratorData) => {
      setImmediate(() => collaborationHandlers.handleCollaboratorAdded(socket, noteId, collaboratorData, io));
    });

    socket.on('collaboratorRemoved', (noteId, collaboratorData) => {
      setImmediate(() => collaborationHandlers.handleCollaboratorRemoved(socket, noteId, collaboratorData, io));
    });

    socket.on('disconnect', () => {
      noteHandlers.handleDisconnect(socket, activeUsers, io);
    });

    socket.on('applyOperation', (noteId, operation) => {
      setImmediate(() => conflictHandlers.handleApplyOperation(socket, noteId, operation, io));
    });

    socket.on('requestVersionHistory', (noteId) => {
      setImmediate(() => conflictHandlers.handleRequestVersionHistory(socket, noteId));
    });

    socket.on('restoreVersion', (noteId, version) => {
      setImmediate(() => conflictHandlers.handleRestoreVersion(socket, noteId, version, io));
    });

    socket.on('manualConflictResolution', (noteId, resolution) => {
      setImmediate(() => conflictHandlers.handleManualConflictResolution(socket, noteId, resolution, io));
    });
  });

  return io;
};