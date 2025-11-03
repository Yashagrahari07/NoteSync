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
      // Get the current note content
      const note = await NoteModel.findById(noteId);
      if (!note) {
        throw new Error('Note not found');
      }

      // Get pending operations for this note
      const pendingOperations = await OperationModel.find({
        noteId,
        applied: false
      }).sort({ timestamp: 1 });

      // Check for conflicts with existing operations
      const conflicts = [];
      const transformedOperations = [];
      let currentOperation = { ...operation };

      for (const pendingOp of pendingOperations) {
        try {
          // Try to transform the operations
          const [transformedNewOp, transformedPendingOp] = 
            OperationalTransformation.transform(currentOperation, pendingOp);
          
          transformedOperations.push({
            original: pendingOp,
            transformed: transformedPendingOp
          });
          
          currentOperation = transformedNewOp;
        } catch (error) {
          if (error.message.startsWith('CONFLICT')) {
            conflicts.push({
              operation1: currentOperation,
              operation2: pendingOp,
              type: error.message
            });
          } else {
            throw error;
          }
        }
      }

      // If conflicts exist, resolve them
      if (conflicts.length > 0) {
        const resolution = await this.resolveConflicts(conflicts, noteId);
        return {
          success: true,
          conflicts: conflicts,
          resolution: resolution,
          transformedOperation: currentOperation
        };
      }

      // Apply transformed operations to note content
      let updatedContent = note.content;
      for (const { original, transformed } of transformedOperations) {
        updatedContent = OperationalTransformation.applyOperation(updatedContent, transformed);
        
        // Mark original operation as applied
        await OperationModel.findByIdAndUpdate(original._id, {
          applied: true
        });
      }

      // Apply the final transformed operation
      updatedContent = OperationalTransformation.applyOperation(updatedContent, currentOperation);
      
      // Update note content
      await NoteModel.findByIdAndUpdate(noteId, {
        content: updatedContent,
        updatedOn: new Date()
      });

      // Save the new operation
      const newOperation = new OperationModel({
        ...currentOperation,
        noteId,
        applied: true
      });
      await newOperation.save();

      return {
        success: true,
        conflicts: [],
        transformedOperation: currentOperation,
        updatedContent
      };

    } catch (error) {
      console.error('Error processing operation:', error);
      throw error;
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

      // Mark losing operation as resolved
      const losingOperation = winningOperation === conflict.operation1 
        ? conflict.operation2 
        : conflict.operation1;

      await OperationModel.findByIdAndUpdate(losingOperation._id, {
        conflictResolved: true,
        resolvedBy: winningOperation.userId,
        resolvedAt: new Date()
      });

      resolutions.push({
        conflict,
        winningOperation,
        losingOperation,
        resolution: 'last-write-wins'
      });
    }

    // Create version snapshot for conflict resolution
    await this.createConflictVersion(noteId, conflicts, resolutions);

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
    const note = await NoteModel.findById(noteId);
    if (!note) {
      throw new Error('Note not found');
    }

    // Get current version number
    const lastVersion = await NoteVersionModel.findOne({ noteId })
      .sort({ version: -1 });
    const versionNumber = lastVersion ? lastVersion.version + 1 : 1;

    // Create version snapshot
    const version = new NoteVersionModel({
      noteId,
      version: versionNumber,
      content: note.content,
      title: note.title,
      createdBy: note.userId,
      createdByFullname: note.owner.fullname,
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
      .sort({ version: -1 })
      .limit(limit)
      .populate('createdBy', 'fullname')
      .populate('resolvedBy', 'fullname');
  }

  /**
   * Get specific version
   * @param {string} noteId - Note ID
   * @param {number} version - Version number
   * @returns {Object} - Version details
   */
  static async getVersion(noteId, version) {
    return await NoteVersionModel.findOne({ noteId, version })
      .populate('createdBy', 'fullname')
      .populate('resolvedBy', 'fullname');
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
      changes: [{
        type: 'update',
        content: `Restored to version ${version}`,
        userId,
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
    }).sort({ timestamp: 1 });
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
