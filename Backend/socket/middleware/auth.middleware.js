const { verifyAccessToken } = require('../../utils/jwt.utils');
const UserModel = require('../../models/user.model');

module.exports.socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded._id);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = decoded._id;
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

