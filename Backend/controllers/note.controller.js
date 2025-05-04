const NoteService = require("../services/note.service");

const createNote = async (req, res) => {
  try {
    const note = await NoteService.createNote(req.body, req.user._id);
    res.status(201).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllNotes = async (req, res) => {
  try {
    const notes = await NoteService.getAllNotes(req.user._id);
    res.status(200).json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getNoteById = async (req, res) => {
  try {
    const note = await NoteService.getNoteById(req.params.id, req.user._id);
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateNote = async (req, res) => {
  try {
    const updated = await NoteService.updateNote(req.params.id, req.body, req.user._id);
    if (!updated) return res.status(404).json({ message: "Note not found or unauthorized" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteNote = async (req, res) => {
  try {
    const deleted = await NoteService.deleteNote(req.params.id, req.user._id);
    if (!deleted) return res.status(404).json({ message: "Note not found or unauthorized" });
    res.status(200).json({ message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const addCollaborator = async (req, res) => {
  try {
    const { email } = req.body;
    const { id: noteId } = req.params;

    const updatedNote = await NoteService.addCollaborator(noteId, email, req.user._id);
    res.status(200).json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const togglePinNote = async (req, res) => {
  try {
    const { id: noteId } = req.params;
    const note = await NoteService.togglePinNote(noteId, req.user._id);

    if (!note) {
      return res.status(404).json({ message: "Note not found or unauthorized" });
    }

    res.status(200).json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  addCollaborator,
  togglePinNote,
};