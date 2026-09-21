const jwt = require('jsonwebtoken');

// Unlike requireAuth, this never blocks the request. If a valid token is
// present, req.userId is set; otherwise the request continues as anonymous.
function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = payload.sub;
    } catch (err) {
      // Invalid/expired token — just treat as anonymous, don't error out
    }
  }
  next();
}

module.exports = { optionalAuth };