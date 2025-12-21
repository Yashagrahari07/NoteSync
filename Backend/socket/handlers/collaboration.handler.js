const UserModel = require('../../models/user.model');
const NoteService = require('../../services/note.service');
const UserPreferencesService = require('../../services/userPreferences.service');
const { socketRateLimit } = require('../middleware/rateLimit.middleware');

module.exports.handleTypingStart = async (socket, noteId, io) => {
  const rateLimit = socketRateLimit(socket, 'typingStart');
  if (!rateLimit.allowed) {
    return;
  }

  try {
    const user = await UserModel.findById(socket.userId);
    if (!user) return;

    socket.to(noteId).emit('userTyping', {
      userId: socket.userId,
      userFullname: user.fullname,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling typing start:', error);
  }
};

module.exports.handleTypingStop = async (socket, noteId, io) => {
  const rateLimit = socketRateLimit(socket, 'typingStop');
  if (!rateLimit.allowed) {
    return;
  }

  try {
    socket.to(noteId).emit('userStoppedTyping', {
      userId: socket.userId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error handling typing stop:', error);
  }
};

module.exports.handleCollaboratorAdded = async (socket, noteId, collaboratorData, io) => {
  try {
    const note = await NoteService.getNoteById(noteId, socket.userId);
    if (!note) {
      socket.emit('error', { message: 'Note not found' });
      return;
    }

    const user = await UserModel.findById(socket.userId);
    if (!user) return;

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    io.to(noteId).emit('collaboratorAdded', {
      note: note,
      collaborator: collaboratorData,
      timestamp: Date.now()
    });

    if (preferences.notifications.collaboratorChanges) {
      io.to(noteId).emit('notification', {
        type: 'collaboratorAdded',
        message: `${collaboratorData.fullname} was added as a collaborator`,
        userId: collaboratorData.userId,
        userFullname: collaboratorData.fullname,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    socket.emit('error', { message: 'Error handling collaborator addition' });
  }
};

module.exports.handleCollaboratorRemoved = async (socket, noteId, collaboratorData, io) => {
  try {
    const note = await NoteService.getNoteById(noteId, socket.userId);
    if (!note) {
      socket.emit('error', { message: 'Note not found' });
      return;
    }

    const user = await UserModel.findById(socket.userId);
    if (!user) return;

    const preferences = await UserPreferencesService.getUserPreferences(socket.userId);

    io.to(noteId).emit('collaboratorRemoved', {
      note: note,
      collaborator: collaboratorData,
      timestamp: Date.now()
    });

    if (preferences.notifications.collaboratorChanges) {
      io.to(noteId).emit('notification', {
        type: 'collaboratorRemoved',
        message: `${collaboratorData.fullname} was removed as a collaborator`,
        userId: collaboratorData.userId,
        userFullname: collaboratorData.fullname,
        timestamp: Date.now()
      });
    }
  } catch (error) {
    socket.emit('error', { message: 'Error handling collaborator removal' });
  }
};

