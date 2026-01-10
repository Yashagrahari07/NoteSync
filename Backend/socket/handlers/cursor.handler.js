const NoteModel = require('../../models/note.model');
const { socketRateLimit } = require('../middleware/rateLimit.middleware');

/**
 * Handle cursor position updates
 * @param {Socket} socket - Socket instance
 * @param {string} noteId - Note ID
 * @param {Object} cursorData - Cursor position data
 * @param {Server} io - Socket.IO server instance
 */
module.exports.handleCursorMove = async (socket, noteId, cursorData, io) => {
  const rateLimit = socketRateLimit(socket, 'cursorMove');
  if (!rateLimit.allowed) {
    return; // Silently ignore rate-limited cursor updates
  }

  try {
    const noteIdStr = noteId.toString();
    
    // Ensure socket is in the room
    const rooms = Array.from(socket.rooms);
    if (!rooms.includes(noteIdStr)) {
      socket.join(noteIdStr);
    }

    // Use findByIdAndUpdate with $set to avoid version conflicts
    // This updates only the cursorPositions array without triggering optimistic concurrency
    const cursorPosition = {
      userId: socket.userId,
      userFullname: cursorData.userFullname || 'Unknown',
      position: {
        line: 0, // TipTap uses character position, not line/column
        ch: cursorData.position || 0,
      },
      timestamp: new Date(),
    };

    // First, try to find and update existing cursor
    const note = await NoteModel.findById(noteId);
    if (!note) {
      return;
    }

    const cursorIndex = note.cursorPositions.findIndex(
      (cp) => cp.userId.toString() === socket.userId.toString()
    );

    let updateResult;
    if (cursorIndex >= 0) {
      // Update existing cursor position using $set with array index
      updateResult = await NoteModel.findByIdAndUpdate(
        noteId,
        {
          $set: {
            [`cursorPositions.${cursorIndex}`]: cursorPosition
          }
        },
        { new: true, runValidators: false } // Skip validation to avoid version conflicts
      );
    } else {
      // Add new cursor position using $push
      updateResult = await NoteModel.findByIdAndUpdate(
        noteId,
        {
          $push: { cursorPositions: cursorPosition }
        },
        { new: true, runValidators: false }
      );
    }

    if (!updateResult) {
      return;
    }

    // Broadcast to other users in the room
    socket.to(noteIdStr).emit('cursorMoved', {
      userId: socket.userId.toString(),
      userFullname: cursorData.userFullname || 'Unknown',
      position: cursorData.position || 0,
      timestamp: Date.now(),
    });
  } catch (error) {
    // Silently ignore version errors for cursor updates (they're not critical)
    if (!error.message.includes('VersionError')) {
      console.error('Error handling cursor move:', error);
    }
  }
};

/**
 * Clean up cursor positions when user leaves
 * @param {Socket} socket - Socket instance
 * @param {string} noteId - Note ID
 * @param {Server} io - Socket.IO server instance
 */
module.exports.handleCursorCleanup = async (socket, noteId, io) => {
  try {
    const noteIdStr = noteId.toString();
    
    // Use findByIdAndUpdate with $pull to avoid version conflicts
    const updateResult = await NoteModel.findByIdAndUpdate(
      noteId,
      {
        $pull: {
          cursorPositions: { userId: socket.userId }
        }
      },
      { new: true, runValidators: false } // Skip validation to avoid version conflicts
    );

    if (!updateResult) {
      return;
    }

    // Notify other users
    socket.to(noteIdStr).emit('cursorRemoved', {
      userId: socket.userId.toString(),
      timestamp: Date.now(),
    });
  } catch (error) {
    // Silently ignore version errors for cursor cleanup (they're not critical)
    if (!error.message.includes('VersionError')) {
      console.error('Error cleaning up cursor:', error);
    }
  }
};

