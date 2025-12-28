const Note = require("../models/note.model");
const userModel = require("../models/user.model");
const NotificationService = require("./notification.service");

exports.createNote = async (data, userId) => {
  try {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    // Fetch a random quote
    const response = await fetch('https://zenquotes.io/api/random');
    const quoteData = await response.json();
    const quote = quoteData[0];

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

exports.getAllNotes = async (userId, options = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    sortBy = 'updatedOn', 
    sortOrder = -1,
    filterType = 'all', // 'all' | 'owned' | 'shared'
    isPinned = undefined // boolean | undefined
  } = options;
  
  let query = {};
  
  // Base query based on filterType
  if (filterType === 'owned') {
    // Only notes owned by the user
    query.userId = userId;
  } else if (filterType === 'shared') {
    // Only notes where user is a collaborator but NOT the owner
    query = {
      "collaborators.userId": userId,
      userId: { $ne: userId } // Not the owner
    };
  } else {
    // All notes (owned or shared)
    query = {
      $or: [{ userId }, { "collaborators.userId": userId }]
    };
  }
  
  // Add pinned filter if specified
  if (isPinned !== undefined) {
    query.isPinned = isPinned;
  }
  
  return await Note.find(query)
    .select('title content description tags isPinned updatedOn owner collaborators userId quote')
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

exports.searchNotes = async (userId, query, filters = {}) => {
  const { 
    tags, 
    dateRange, 
    ownerId, 
    collaboratorId, 
    isPinned, 
    page = 1, 
    limit = 20, 
    sortBy = 'updatedOn', 
    sortOrder = -1,
    filterType = 'all' // 'all' | 'owned' | 'shared'
  } = filters;
  
  let searchQuery = {};
  
  // Base query based on filterType
  if (filterType === 'owned') {
    // Only notes owned by the user
    searchQuery.userId = userId;
  } else if (filterType === 'shared') {
    // Only notes where user is a collaborator but NOT the owner
    searchQuery = {
      "collaborators.userId": userId,
      userId: { $ne: userId } // Not the owner
    };
  } else {
    // All notes (owned or shared)
    searchQuery = {
      $or: [{ userId }, { "collaborators.userId": userId }]
    };
  }
  
  // Text search - add to existing query using $and
  if (query && query.trim()) {
    const textSearch = {
      $or: [
        { title: { $regex: query.trim(), $options: 'i' } },
        { content: { $regex: query.trim(), $options: 'i' } }
      ]
    };
    
    // Combine base query with text search using $and
    const baseQuery = { ...searchQuery };
    searchQuery = {
      $and: [
        baseQuery,
        textSearch
      ]
    };
  }
  
  // Tag filtering - add to $and if text search exists, otherwise add directly
  if (tags && tags.length > 0) {
    if (searchQuery.$and) {
      searchQuery.$and.push({ tags: { $in: tags } });
    } else {
      searchQuery.tags = { $in: tags };
    }
  }
  
  // Date range filtering
  if (dateRange && dateRange.start && dateRange.end) {
    const dateFilter = {
      updatedOn: {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      }
    };
    if (searchQuery.$and) {
      searchQuery.$and.push(dateFilter);
    } else {
      searchQuery.updatedOn = dateFilter.updatedOn;
    }
  }
  
  // Owner filtering (only if not already set by filterType)
  if (ownerId && filterType === 'all') {
    if (searchQuery.$and) {
      searchQuery.$and.push({ userId: ownerId });
    } else {
      searchQuery.userId = ownerId;
    }
  }
  
  // Collaborator filtering (only if not already set by filterType)
  if (collaboratorId && filterType === 'all') {
    if (searchQuery.$and) {
      searchQuery.$and.push({ "collaborators.userId": collaboratorId });
    } else {
      searchQuery["collaborators.userId"] = collaboratorId;
    }
  }
  
  // Pinned filtering
  if (isPinned !== undefined) {
    if (searchQuery.$and) {
      searchQuery.$and.push({ isPinned });
    } else {
      searchQuery.isPinned = isPinned;
    }
  }
  
  return await Note.find(searchQuery)
    .select('title content description tags isPinned updatedOn owner collaborators userId quote')
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
};

exports.getNoteById = async (id, userId) => {
  try {
    const note = await Note.findOne({
      _id: id,
      $or: [{ userId }, { "collaborators.userId": userId }],
    })
      .populate('userId', 'fullname email')
      .populate('collaborators.userId', 'fullname email')
      .lean();

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
  // Remove createdOn from data if present to prevent it from being updated
  const { createdOn, ...updateData } = data;
  
  return await Note.findOneAndUpdate(
    { _id: id, $or: [{ userId }, { "collaborators.userId": userId }] },
    { ...updateData, updatedOn: Date.now() },
    { new: true }
  )
    .select('title content description tags isPinned updatedOn createdOn owner collaborators quote')
    .lean();
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

  return note.toObject();
};