const Note = require("../models/note.model");

exports.createNote = async (data, userId) => {
  return await Note.create({ ...data, userId });
};

exports.getAllNotes = async (userId) => {
  return await Note.find({ $or: [{ userId }, { collaborators: userId }] }).sort({ updatedOn: -1 });
};

exports.getNoteById = async (id, userId) => {
  return await Note.findOne({ _id: id, $or: [{ userId }, { collaborators: userId }] });
};

exports.updateNote = async (id, data, userId) => {
  return await Note.findOneAndUpdate(
    { _id: id, $or: [{ userId }, { collaborators: userId }] },
    { ...data, updatedOn: Date.now() },
    { new: true }
  );
};

exports.deleteNote = async (id, userId) => {
  const note = await Note.findOne({ _id: id, userId });
  if (!note) return null;
  await note.deleteOne();
  return true;
};