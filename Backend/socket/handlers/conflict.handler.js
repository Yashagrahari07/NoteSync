const UserModel = require('../../models/user.model');
const ConflictResolutionService = require('../../services/conflictResolution.service');
const { socketRateLimit } = require('../middleware/rateLimit.middleware');

module.exports.handleApplyOperation = async (socket, noteId, operation, io) => {
  const rateLimit = socketRateLimit(socket, 'applyOperation');
  if (!rateLimit.allowed) {
    socket.emit('rateLimitExceeded', {
      message: 'Too many operations. Please slow down.',
      retryAfter: rateLimit.retryAfter,
      code: 'RATE_LIMIT_EXCEEDED'
    });
    return;
  }

  try {
    const noteIdStr = noteId.toString();
    
    // Ensure socket is in the room
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(noteIdStr)) {
      socket.join(noteIdStr);
    }

    const user = await UserModel.findById(socket.userId);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    operation.userId = socket.userId;
    operation.userFullname = user.fullname;

    const result = await ConflictResolutionService.processOperation(operation, noteId);

    if (result.success) {
      // Emit to ALL users including the sender (for consistency)
      // This ensures everyone sees the transformed operation and updated content
      const operationData = {
        operation: result.transformedOperation,
        conflicts: result.conflicts || [],
        resolution: result.resolution,
        updatedContent: result.updatedContent,
        timestamp: Date.now()
      };
      
      // Emit to all users in the room
      io.to(noteIdStr).emit('operationApplied', operationData);
      
      // Also emit noteUpdated for backward compatibility (but only to other users)
      // This ensures clients that don't handle operations still get updates
      if (result.updatedContent !== undefined) {
        const NoteService = require('../../services/note.service');
        const updatedNote = await NoteService.getNoteById(noteId, socket.userId);
        if (updatedNote) {
          // Emit to other users only (sender already has the update)
          socket.to(noteIdStr).emit('noteUpdated', updatedNote);
        }
      }
      
      if (result.conflicts && result.conflicts.length > 0) {
        io.to(noteIdStr).emit('conflictResolved', {
          conflicts: result.conflicts,
          resolution: result.resolution,
          timestamp: Date.now()
        });
      }
    } else {
      socket.emit('error', { message: result.message || 'Failed to apply operation' });
    }
  } catch (error) {
    console.error('Error applying operation:', error);
    socket.emit('error', { message: 'Error applying operation' });
  }
};

module.exports.handleRequestVersionHistory = async (socket, noteId) => {
  try {
    const versions = await ConflictResolutionService.getVersionHistory(noteId, 10);
    socket.emit('versionHistory', {
      noteId,
      versions,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    socket.emit('error', { message: 'Error fetching version history' });
  }
};

module.exports.handleRestoreVersion = async (socket, noteId, version, io) => {
  try {
    const noteIdStr = noteId.toString();
    
    const updatedNote = await ConflictResolutionService.restoreVersion(
      noteId, 
      version, 
      socket.userId
    );

    io.to(noteIdStr).emit('versionRestored', {
      note: updatedNote,
      version,
      restoredBy: socket.userId,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    socket.emit('error', { message: 'Error restoring version' });
  }
};

module.exports.handleManualConflictResolution = async (socket, noteId, resolution, io) => {
  try {
    const noteIdStr = noteId.toString();
    
    const user = await UserModel.findById(socket.userId);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    io.to(noteIdStr).emit('manualResolutionApplied', {
      resolution,
      resolvedBy: {
        userId: socket.userId,
        fullname: user.fullname
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error applying manual resolution:', error);
    socket.emit('error', { message: 'Error applying manual resolution' });
  }
};

