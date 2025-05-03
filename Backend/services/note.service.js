const axios = require('axios');
const Note = require("../models/note.model");

exports.createNote = async (data, userId) => {
  try {
    // Fetch a random quote
    const response = await axios.get('https://zenquotes.io/api/random');
    const quote = response.data[0];

    return await Note.create({
      ...data,
      userId,
      quote: {
        text: quote.q,
        author: quote.a
      }
    });
  } catch (err) {
    console.error("Failed to fetch quote:", err.message);

    return await Note.create({
      ...data,
      userId
    });
  }
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