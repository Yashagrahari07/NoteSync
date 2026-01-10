const Note = require("../models/note.model");
const userModel = require("../models/user.model");
const NotificationService = require("./notification.service");
const PendingInvitation = require("../models/pendingInvitation.model");
const NotificationModel = require("../models/notification.model");

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
    .select('title content description tags isPinned updatedOn owner collaborators userId quote settings')
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
    .select('title content description tags isPinned updatedOn owner collaborators userId quote settings')
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

    // Ensure settings exist with defaults if not present (for backward compatibility)
    if (!note.settings) {
      note.settings = {
        notifications: {
          joinLeave: true,
          collaboratorChanges: true,
          liveEdits: true,
          cursorMoves: true
        },
        realTime: {
          showCursors: true,
          showSelections: true,
          showPresence: true
        }
      };
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
    .select('title content description tags isPinned updatedOn createdOn owner collaborators quote settings')
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

  const invitee = await userModel.findOne({ email });
  if (!invitee) throw new Error("User not found with this email");

  // Can't invite yourself
  if (invitee._id.toString() === userId.toString()) {
    throw new Error("You cannot invite yourself");
  }

  // Check if already a collaborator
  const isAlreadyCollaborator = note.collaborators.some(
    (collab) => collab.userId.toString() === invitee._id.toString()
  );
  if (isAlreadyCollaborator) throw new Error("User is already a collaborator");

  // Check if invitation already pending
  const existingInvitation = await PendingInvitation.findOne({
    noteId,
    inviteeId: invitee._id,
    status: 'pending'
  });
  if (existingInvitation) {
    throw new Error("Invitation already sent to this user");
  }

  // Get inviter details
  const inviter = await userModel.findById(userId);

  // Create pending invitation
  const invitation = await PendingInvitation.create({
    noteId,
    noteTitle: note.title,
    inviterId: userId,
    inviterName: inviter.fullname,
    inviterEmail: inviter.email,
    inviteeId: invitee._id,
    inviteeEmail: invitee.email,
    status: 'pending'
  });

  // Create notification with invitation link
  await NotificationModel.create({
    userId: invitee._id,
    type: 'collaborationInvite',
    invitationId: invitation._id,
    title: 'Collaboration Invite',
    message: `${inviter.fullname} invited you to collaborate`,
    noteId,
    noteTitle: note.title,
    noteOwner: inviter.fullname
  });

  return {
    success: true,
    message: `Invitation sent to ${invitee.fullname}`,
    invitee: {
      email: invitee.email,
      fullname: invitee.fullname
    }
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

// Update note settings
exports.updateNoteSettings = async (noteId, userId, settings) => {
  const note = await Note.findOne({
    _id: noteId,
    $or: [{ userId }, { "collaborators.userId": userId }],
  });

  if (!note) {
    throw new Error("Note not found or unauthorized");
  }

  // Merge settings with existing settings
  if (!note.settings) {
    note.settings = {
      notifications: {
        joinLeave: true,
        collaboratorChanges: true,
        liveEdits: true,
        cursorMoves: true
      },
      realTime: {
        showCursors: true,
        showSelections: true,
        showPresence: true
      }
    };
  }

  if (settings.notifications) {
    note.settings.notifications = {
      ...note.settings.notifications,
      ...settings.notifications
    };
  }

  if (settings.realTime) {
    note.settings.realTime = {
      ...note.settings.realTime,
      ...settings.realTime
    };
  }

  await note.save();

  return note.toObject();
};