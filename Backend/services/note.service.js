const axios = require('axios');
const Note = require("../models/note.model");
const userModel = require("../models/user.model");
const NotificationService = require("./notification.service");

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
      return null;
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
  // First check if note exists and user has access
  const note = await Note.findOne({
    _id: id,
    $or: [{ userId }, { "collaborators.userId": userId }]
  });
  
  if (!note) {
    return { error: 'NOT_FOUND', message: 'Note not found' };
  }
  
  // Check if user is the owner (only owners can delete)
  if (note.userId.toString() !== userId.toString()) {
    return { error: 'FORBIDDEN', message: 'You cannot delete this note. Only the owner can delete shared notes.' };
  }
  
  // User is the owner, proceed with deletion
  await note.deleteOne();
  return { success: true };
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

  // Create notification for the added collaborator
  try {
    const actionUser = await userModel.findById(userId);
    const noteOwner = await userModel.findById(note.userId);
    

    
    await NotificationService.createCollaboratorNotification(
      'collaboratorAdded',
      noteId,
      note.title,
      noteOwner,
      collaborator._id,
      actionUser
    );
  } catch (error) {
    console.error('Error creating collaborator notification:', error);
  }

  return {
    ...note.toObject(),
    collaborators: note.collaborators.map((collab) => ({
      email: collab.email,
      fullname: collab.fullname,
    })),
  };
};

// Remove collaborator from note
exports.removeCollaborator = async (noteId, collaboratorId, userId) => {
  const note = await Note.findOne({ _id: noteId, userId });
  if (!note) throw new Error("Note not found or unauthorized");

  const collaboratorIndex = note.collaborators.findIndex(
    (collab) => collab.userId.toString() === collaboratorId
  );

  if (collaboratorIndex === -1) throw new Error("Collaborator not found");

  const removedCollaborator = note.collaborators[collaboratorIndex];
  note.collaborators.splice(collaboratorIndex, 1);
  await note.save();

  // Create notification for the removed collaborator
  try {
    const actionUser = await userModel.findById(userId);
    const noteOwner = await userModel.findById(note.userId);
    

    
    await NotificationService.createCollaboratorNotification(
      'collaboratorRemoved',
      noteId,
      note.title,
      noteOwner,
      removedCollaborator.userId,
      actionUser
    );
  } catch (error) {
    console.error('Error creating collaborator removal notification:', error);
  }

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