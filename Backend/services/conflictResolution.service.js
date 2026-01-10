const OperationalTransformation = require('../utils/operationalTransformation');
const OperationModel = require('../models/operation.model');
const NoteVersionModel = require('../models/noteVersion.model');
const NoteModel = require('../models/note.model');

class ConflictResolutionService {
  /**
   * Process incoming operation and handle conflicts
   * @param {Object} operation - The operation to process
   * @param {string} noteId - Note ID
   * @returns {Object} - Result with success status and any conflicts
   */
  static async processOperation(operation, noteId) {
    try {
      const note = await NoteModel.findById(noteId);
      if (!note) {
        return { success: false, message: 'Note not found' };
      }

      // Get pending operations for this note
      const pendingOps = await OperationModel.find({
        noteId,
        applied: false,
      }).sort({ timestamp: 1 }).lean();

      // Transform operation against all pending operations
      const transformedOp = OperationalTransformation.transformAgainstOperations(
        operation,
        pendingOps
      );

      if (!transformedOp) {
        return {
          success: false,
          message: 'Operation resulted in no-op',
        };
      }

      // Get current note content
      let updatedContent = note.content;

      // Apply all pending operations first
      for (const pendingOp of pendingOps) {
        if (pendingOp.type !== 'noop') {
          updatedContent = OperationalTransformation.applyOperation(updatedContent, pendingOp);
        }
        await OperationModel.findByIdAndUpdate(pendingOp._id, { applied: true });
      }

      // Apply transformed operation
      updatedContent = OperationalTransformation.applyOperation(updatedContent, transformedOp);

      // Update note
      await NoteModel.findByIdAndUpdate(noteId, {
        content: updatedContent,
        updatedOn: Date.now()
      });

      // Save operation
      const savedOp = await OperationModel.create({
        ...transformedOp,
        noteId,
        applied: true,
      });

      return {
        success: true,
        transformedOperation: savedOp,
        updatedContent: updatedContent,
      };
    } catch (error) {
      console.error('Error processing operation:', error);
      return {
        success: false,
        message: 'Failed to process operation',
        error: error.message,
      };
    }
  }

  /**
   * Resolve conflicts using last-write-wins strategy
   * @param {Array} conflicts - Array of conflicts
   * @param {string} noteId - Note ID
   * @returns {Object} - Resolution details
   */
  static async resolveConflicts(conflicts, noteId) {
    const resolutions = [];

    for (const conflict of conflicts) {
      const winningOperation = OperationalTransformation.resolveConflict(
        conflict.operation1,
        conflict.operation2
      );

      const losingOperation = winningOperation === conflict.operation1 
        ? conflict.operation2 
        : conflict.operation1;

      if (losingOperation._id) {
        await OperationModel.findByIdAndUpdate(losingOperation._id, {
          conflictResolved: true,
          resolvedBy: winningOperation.userId,
          resolvedAt: new Date()
        });
      }

      resolutions.push({
        conflict,
        winningOperation,
        losingOperation,
        resolution: 'last-write-wins'
      });
    }

    if (conflicts.length > 0) {
      await this.createConflictVersion(noteId, conflicts, resolutions);
    }

    return {
      type: 'last-write-wins',
      resolutions
    };
  }

  /**
   * Apply transformed operations to the note
   * @param {Array} transformedOperations - Array of transformed operations
   * @param {string} noteId - Note ID
   */
  static async applyTransformedOperations(transformedOperations, noteId) {
    const note = await NoteModel.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    let currentContent = note.content;

    for (const { original, transformed } of transformedOperations) {
      // Apply the transformed operation
      currentContent = OperationalTransformation.applyOperation(
        currentContent, 
        transformed
      );

      // Mark original operation as applied
      await OperationModel.findByIdAndUpdate(original._id, {
        applied: true
      });
    }

    // Update note content
    await NoteModel.findByIdAndUpdate(noteId, {
      content: currentContent,
      updatedOn: new Date()
    });
  }

  /**
   * Create version snapshot for conflict resolution
   * @param {string} noteId - Note ID
   * @param {Array} conflicts - Array of conflicts
   * @param {Array} resolutions - Array of resolutions
   */
  static async createConflictVersion(noteId, conflicts, resolutions) {
    const note = await NoteModel.findById(noteId).populate('userId', 'fullname');
    if (!note) {
      throw new Error('Note not found');
    }

    // Get current version number
    const lastVersion = await NoteVersionModel.findOne({ noteId })
      .sort({ version: -1 });
    const versionNumber = lastVersion ? lastVersion.version + 1 : 1;

    // Get owner fullname - use populated userId or fallback to owner.fullname
    const ownerFullname = note.userId?.fullname || note.owner?.fullname || 'Unknown User';

    // Create version snapshot
    const version = new NoteVersionModel({
      noteId,
      version: versionNumber,
      content: note.content,
      title: note.title,
      createdBy: note.userId?._id || note.userId,
      createdByFullname: ownerFullname,
      conflictResolved: true,
      conflictDetails: {
        operations: conflicts.flatMap(conflict => [
          conflict.operation1,
          conflict.operation2
        ]).map(op => ({
          type: op.type,
          position: op.position,
          content: op.content,
          userId: op.userId,
          userFullname: op.userFullname,
          timestamp: op.timestamp
        })),
        resolution: 'last-write-wins',
        resolvedBy: resolutions[0]?.winningOperation.userId,
        resolvedAt: new Date()
      }
    });

    await version.save();
  }

  /**
   * Get version history for a note
   * @param {string} noteId - Note ID
   * @param {number} limit - Number of versions to return
   * @returns {Array} - Array of versions
   */
  static async getVersionHistory(noteId, limit = 10) {
    return await NoteVersionModel.find({ noteId })
      .select('version content title createdBy createdByFullname createdAt conflictResolved')
      .sort({ version: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get specific version
   * @param {string} noteId - Note ID
   * @param {number} version - Version number
   * @returns {Object} - Version details
   */
  static async getVersion(noteId, version) {
    return await NoteVersionModel.findOne({ noteId, version })
      .select('version content title createdBy createdByFullname createdAt conflictResolved')
      .lean();
  }

  /**
   * Restore note to a specific version
   * @param {string} noteId - Note ID
   * @param {number} version - Version number
   * @param {string} userId - User ID performing the restore
   * @returns {Object} - Updated note
   */
  static async restoreVersion(noteId, version, userId) {
    const versionDoc = await this.getVersion(noteId, version);
    if (!versionDoc) {
      throw new Error('Version not found');
    }

    // Get user info for createdByFullname
    const UserModel = require('../models/user.model');
    const user = await UserModel.findById(userId);
    const userFullname = user?.fullname || 'Unknown User';

    // Update note content
    const updatedNote = await NoteModel.findByIdAndUpdate(noteId, {
      content: versionDoc.content,
      title: versionDoc.title,
      updatedOn: new Date()
    }, { new: true });

    // Create new version for the restore
    const lastVersion = await NoteVersionModel.findOne({ noteId })
      .sort({ version: -1 });
    const newVersionNumber = lastVersion ? lastVersion.version + 1 : 1;

    const restoreVersion = new NoteVersionModel({
      noteId,
      version: newVersionNumber,
      content: versionDoc.content,
      title: versionDoc.title,
      createdBy: userId,
      createdByFullname: userFullname,
      changes: [{
        type: 'update',
        content: `Restored to version ${version}`,
        userId,
        userFullname: userFullname,
        timestamp: new Date()
      }]
    });

    await restoreVersion.save();

    return updatedNote;
  }

  /**
   * Get pending operations for a note
   * @param {string} noteId - Note ID
   * @returns {Array} - Array of pending operations
   */
  static async getPendingOperations(noteId) {
    return await OperationModel.find({
      noteId,
      applied: false
    })
      .select('type position content userId userFullname timestamp version')
      .sort({ timestamp: 1 })
      .lean();
  }

  /**
   * Clear resolved conflicts for a note
   * @param {string} noteId - Note ID
   */
  static async clearResolvedConflicts(noteId) {
    await OperationModel.deleteMany({
      noteId,
      conflictResolved: true
    });
  }
}

module.exports = ConflictResolutionService;
