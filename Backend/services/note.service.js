const axios = require('axios');
const Note = require("../models/note.model");
const userModel = require("../models/user.model");

exports.createNote = async (data, userId) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    // Fetch a random quote
    const response = await axios.get('https://zenquotes.io/api/random');
    const quote = response.data[0];

    return await Note.create({
      ...data,
      userId,
      owner: {
        userId: user._id,
        fullname: user.fullname
      },
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
  return await Note.find({ $or: [{ userId }, { "collaborators.userId": userId }] }).sort({ updatedOn: -1 });
};

exports.getNoteById = async (id, userId) => {
  try {
    const note = await Note.findOne({
      _id: id,
      $or: [{ userId }, { "collaborators.userId": userId }],
    });

    if (!note) {
      console.log(`Note not found for ID: ${id} and user: ${userId}`);
    }

    return note;
  } catch (err) {
    console.error(`Error fetching note: ${err.message}`);
    throw err;
  }
};

exports.updateNote = async (id, data, userId) => {
  return await Note.findOneAndUpdate(
    { _id: id, $or: [{ userId }, { "collaborators.userId": userId }] },
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

exports.addCollaborator = async (noteId, email, userId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw new Error("Note not found or unauthorized");

  const collaborator = await userModel.findOne({ email });
  if (!collaborator) throw new Error("Collaborator not found");

  const isAlreadyCollaborator = note.collaborators.some(
    (collab) => collab.userId.toString() === collaborator._id.toString()
  );

  if (isAlreadyCollaborator) throw new Error("User is already a collaborator");

  note.collaborators.push({
    userId: collaborator._id,
    email: collaborator.email,
    fullname: collaborator.fullname,
  });
  await note.save();

  return {
    ...note.toObject(),
    collaborators: note.collaborators.map((collab) => ({
      email: collab.email,
      fullname: collab.fullname,
    })),
  };
};

exports.togglePinNote = async (noteId, userId) => {
  const note = await Note.findOne({
    _id: noteId,
    $or: [{ userId }, { "collaborators.userId": userId }],
  });

  if (!note) return null;

  note.isPinned = !note.isPinned;
  await note.save();

  return note;
};