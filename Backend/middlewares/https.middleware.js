module.exports.enforceHTTPS = (req, res, next) => {
  const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
  if (!isSecure && process.env.ENFORCE_HTTPS !== 'false') {
    return res.status(403).json({
      message: 'HTTPS required',
      code: 'HTTPS_REQUIRED'
    });
  }
  next();
};

