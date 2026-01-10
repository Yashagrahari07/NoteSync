const BlacklistTokenModel = require('../models/blacklistToken.model');
const UserModel = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt.utils');

module.exports.authUser = async (req, res, next) => {
  try {
    const token = req.cookies.authToken || 
                  req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Check blacklist
    const isBlacklisted = await BlacklistTokenModel.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ 
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
    }

    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded._id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    next(error);
  }
};