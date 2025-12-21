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
    const user = await UserModel.findById(socket.userId);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    operation.userId = socket.userId;
    operation.userFullname = user.fullname;

    const result = await ConflictResolutionService.processOperation(operation, noteId);

    if (result.success) {
      io.to(noteId).emit('operationApplied', {
        operation: result.transformedOperation,
        conflicts: result.conflicts,
        resolution: result.resolution,
        updatedContent: result.updatedContent,
        timestamp: Date.now()
      });

      if (result.conflicts && result.conflicts.length > 0) {
        io.to(noteId).emit('conflictResolved', {
          conflicts: result.conflicts,
          resolution: result.resolution,
          timestamp: Date.now()
        });
      }
    } else {
      socket.emit('error', { message: 'Failed to apply operation' });
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
    const updatedNote = await ConflictResolutionService.restoreVersion(
      noteId, 
      version, 
      socket.userId
    );

    io.to(noteId).emit('versionRestored', {
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
    const user = await UserModel.findById(socket.userId);
    if (!user) {
      socket.emit('error', { message: 'User not found' });
      return;
    }

    io.to(noteId).emit('manualResolutionApplied', {
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

