const express = require('express');
const router = express.Router();
const ConflictResolutionService = require('../services/conflictResolution.service');
const { authUser } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authUser);

/**
 * @route GET /api/conflict-resolution/:noteId/versions
 * @desc Get version history for a note
 * @access Private
 */
router.get('/:noteId/versions', async (req, res) => {
  try {
    const { noteId } = req.params;
    const { limit = 10 } = req.query;

    const versions = await ConflictResolutionService.getVersionHistory(noteId, parseInt(limit));
    
    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error fetching version history:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching version history'
    });
  }
});

/**
 * @route GET /api/conflict-resolution/:noteId/versions/:version
 * @desc Get specific version of a note
 * @access Private
 */
router.get('/:noteId/versions/:version', async (req, res) => {
  try {
    const { noteId, version } = req.params;

    const versionDoc = await ConflictResolutionService.getVersion(noteId, parseInt(version));
    
    if (!versionDoc) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    res.json({
      success: true,
      data: versionDoc
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching version'
    });
  }
});

/**
 * @route POST /api/conflict-resolution/:noteId/versions/:version/restore
 * @desc Restore note to a specific version
 * @access Private
 */
router.post('/:noteId/versions/:version/restore', async (req, res) => {
  try {
    const { noteId, version } = req.params;
    const userId = req.user._id;

    const updatedNote = await ConflictResolutionService.restoreVersion(
      noteId, 
      parseInt(version), 
      userId
    );

    res.json({
      success: true,
      data: updatedNote,
      message: `Note restored to version ${version}`
    });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring version'
    });
  }
});

/**
 * @route GET /api/conflict-resolution/:noteId/operations
 * @desc Get pending operations for a note
 * @access Private
 */
router.get('/:noteId/operations', async (req, res) => {
  try {
    const { noteId } = req.params;

    const operations = await ConflictResolutionService.getPendingOperations(noteId);
    
    res.json({
      success: true,
      data: operations
    });
  } catch (error) {
    console.error('Error fetching pending operations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending operations'
    });
  }
});

/**
 * @route DELETE /api/conflict-resolution/:noteId/operations
 * @desc Clear resolved conflicts for a note
 * @access Private
 */
router.delete('/:noteId/operations', async (req, res) => {
  try {
    const { noteId } = req.params;

    await ConflictResolutionService.clearResolvedConflicts(noteId);
    
    res.json({
      success: true,
      message: 'Resolved conflicts cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing resolved conflicts:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing resolved conflicts'
    });
  }
});

module.exports = router;
