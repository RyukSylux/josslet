const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const auth = req.header("authorization") || req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    const err = new Error("Authentication required");
    err.statusCode = 401;
    err.isClientError = true;
    return next(err);
  }
  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { id: payload.id, email: payload.email };
    next();
  } catch (e) {
    const err = new Error("Invalid or expired token");
    err.statusCode = 401;
    err.isClientError = true;
    return next(err);
  }
}

module.exports = { requireAuth };
