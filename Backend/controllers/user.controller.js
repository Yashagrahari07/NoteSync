const userModel = require('../models/user.model');
const userService = require('../services/user.service');
const { validationResult } = require('express-validator');
const BlacklistTokenModel = require('../models/blacklistToken.model');
const RefreshTokenModel = require('../models/refreshToken.model');
const NoteModel = require('../models/note.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt.utils');

const registerUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullname, email, password } = req.body;

    const existingUser = await userModel.findOne({ $or: [{ fullname }, { email }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Fullname or Email already exists' });
    }

    const hashedPassword = await userModel.hashPassword(password);

    const user = await userService.createUser({
      fullname,
      email,
      password: hashedPassword
    });

    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    // Save refresh token to database
    await RefreshTokenModel.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      accessToken,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken({ _id: user._id });
    const refreshToken = generateRefreshToken({ _id: user._id });

    // Save refresh token to database
    await RefreshTokenModel.create({
      token: refreshToken,
      userId: user._id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      accessToken,
      user: userData
    });

  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const storedToken = await RefreshTokenModel.findOne({
      token: refreshToken,
      userId: decoded._id,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken({ _id: decoded._id });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    next(error);
  }
};

const getUserProfile = async (req, res, next) => {
  res.status(200).json(req.user);
};

const updateProfile = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { fullname, email } = req.body;
    const userId = req.user._id;

    // Check if at least one field is provided
    if (!fullname && !email) {
      return res.status(400).json({ message: 'At least one field (fullname or email) is required' });
    }

    // Check for conflicts with other users
    const conflictQuery = [];
    if (fullname) conflictQuery.push({ fullname, _id: { $ne: userId } });
    if (email) conflictQuery.push({ email, _id: { $ne: userId } });

    if (conflictQuery.length > 0) {
      const existingUser = await userModel.findOne({ $or: conflictQuery });
      if (existingUser) {
        return res.status(409).json({ message: 'Fullname or Email already taken by another user' });
      }
    }

    // Update user
    const updateData = {};
    if (fullname) updateData.fullname = fullname;
    if (email) updateData.email = email;

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    // If fullname changed, update it in all notes where this user is owner or collaborator
    if (fullname) {
      await NoteModel.updateMany(
        { 'owner.userId': userId },
        { 'owner.fullname': fullname }
      );
      await NoteModel.updateMany(
        { 'collaborators.userId': userId },
        { $set: { 'collaborators.$.fullname': fullname } }
      );
    }

    // If email changed, update it in collaborators
    if (email) {
      await NoteModel.updateMany(
        { 'collaborators.userId': userId },
        { $set: { 'collaborators.$.email': email } }
      );
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Check if new password is same as current
    const isSame = await user.comparePassword(newPassword);
    if (isSame) {
      return res.status(400).json({ message: 'New password must be different from current password' });
    }

    // Hash and save new password
    const hashedPassword = await userModel.hashPassword(newPassword);
    user.password = hashedPassword;
    await user.save();

    // Invalidate all refresh tokens for security
    await RefreshTokenModel.deleteMany({ userId });

    res.status(200).json({ message: 'Password changed successfully. Please login again.' });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userFullname = req.user.fullname;

    // Find all notes owned by this user
    const ownedNotes = await NoteModel.find({ userId });

    for (const note of ownedNotes) {
      if (note.collaborators && note.collaborators.length > 0) {
        // Transfer ownership to a random collaborator
        const randomIndex = Math.floor(Math.random() * note.collaborators.length);
        const newOwner = note.collaborators[randomIndex];

        // Update note with new owner
        note.userId = newOwner.userId;
        note.owner = {
          userId: newOwner.userId,
          fullname: newOwner.fullname
        };
        // Remove new owner from collaborators list
        note.collaborators = note.collaborators.filter(
          c => c.userId.toString() !== newOwner.userId.toString()
        );
        await note.save();

        console.log(`Note "${note.title}" ownership transferred to ${newOwner.fullname}`);
      } else {
        // No collaborators, delete the note
        await NoteModel.findByIdAndDelete(note._id);
        console.log(`Note "${note.title}" deleted (no collaborators)`);
      }
    }

    // Remove user from collaborators of other notes
    await NoteModel.updateMany(
      { 'collaborators.userId': userId },
      { $pull: { collaborators: { userId } } }
    );

    // Delete all refresh tokens
    await RefreshTokenModel.deleteMany({ userId });

    // Blacklist current access token if exists
    if (req.token) {
      await BlacklistTokenModel.create({
        token: req.token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      });
    }

    // Delete user
    await userModel.findByIdAndDelete(userId);

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};

const logoutUser = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await RefreshTokenModel.deleteOne({ token: refreshToken });
    }

    // Blacklist current access token
    if (req.token) {
      await BlacklistTokenModel.create({
        token: req.token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      });
    }

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  getUserProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  logoutUser
};