const NoteService = require("../services/note.service");

const createNote = async (req, res) => {
  try {
    const note = await NoteService.createNote(req.body, req.user._id);
    res.status(201).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const { filterType, isPinned, page, limit, sortBy, sortOrder } = req.query;
    const options = {
      filterType: filterType || 'all', // 'all' | 'owned' | 'shared'
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'updatedOn',
      sortOrder: sortOrder === '1' ? 1 : -1,
    };
    const notes = await NoteService.getAllNotes(req.user._id, options);
    res.status(200).json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const getNoteById = async (req, res) => {
  try {
    const note = await NoteService.getNoteById(req.params.id, req.user._id);
    if (!note) return res.status(404).json({ success: false, message: "Note not found" });
    res.status(200).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const updateNote = async (req, res) => {
  try {
    const updated = await NoteService.updateNote(req.params.id, req.body, req.user._id);
    if (!updated) return res.status(404).json({ success: false, message: "Note not found or unauthorized" });
    
    // Broadcast update to all collaborators via socket.io
    // This ensures real-time sync when autosave happens via REST API
    const io = req.app.get('io');
    if (io) {
      const noteIdStr = updated._id.toString();
      const room = io.sockets.adapter.rooms.get(noteIdStr);
      if (room) {
        // Emit noteUpdated with author metadata so frontend can differentiate save vs sync
        io.to(noteIdStr).emit('noteUpdated', {
          ...updated,
          savedBy: req.user._id.toString(),
          savedAt: updated.updatedOn,
        });
        console.log(`Broadcasted REST API update for note ${noteIdStr} to ${room.size} users`);
      }
    }
    
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const deleteNote = async (req, res) => {
  try {
    const result = await NoteService.deleteNote(req.params.id, req.user._id);
    
    if (result.error === 'NOT_FOUND') {
      return res.status(404).json({ message: result.message || "Note not found" });
    }
    
    if (result.error === 'FORBIDDEN') {
      return res.status(403).json({ message: result.message || "You cannot delete this note. Only the owner can delete shared notes." });
    }
    
    if (result.success) {
      return res.status(200).json({ message: "Note deleted successfully" });
    }
    
    res.status(404).json({ message: "Note not found or unauthorized" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    const { id: noteId } = req.params;

    const updatedNote = await NoteService.addCollaborator(noteId, email, req.user._id);
    res.status(200).json({ success: true, data: updatedNote });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const removeCollaborator = async (req, res) => {
  try {
    const { id: noteId, collaboratorId } = req.params;

    const updatedNote = await NoteService.removeCollaborator(noteId, collaboratorId, req.user._id);
    res.status(200).json({ success: true, data: updatedNote });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const togglePinNote = async (req, res) => {
  try {
    const { id: noteId } = req.params;
    const note = await NoteService.togglePinNote(noteId, req.user._id);

    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found or unauthorized" });
    }

    res.status(200).json({ success: true, data: note });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

const searchNotes = async (req, res) => {
  try {
    const { q, tags, startDate, endDate, ownerId, collaboratorId, isPinned, page, limit, sortBy, sortOrder, filterType } = req.query;
    
    const filters = {
      tags: tags ? tags.split(',') : [],
      dateRange: startDate && endDate ? { start: startDate, end: endDate } : undefined,
      ownerId,
      collaboratorId,
      isPinned: isPinned === 'true' ? true : isPinned === 'false' ? false : undefined,
      filterType: filterType || 'all', // 'all' | 'owned' | 'shared'
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy: sortBy || 'updatedOn',
      sortOrder: sortOrder === '1' ? 1 : -1,
    };
    
    const notes = await NoteService.searchNotes(req.user._id, q, filters);
    res.status(200).json({ success: true, data: notes });
  } catch (err) {
    res.status(500).json({ success: false, error: { message: err.message } });
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  addCollaborator,
  removeCollaborator,
  togglePinNote,
  searchNotes,
};