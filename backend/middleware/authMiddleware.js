const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak tersedia.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Berisi userId, tenantId, role
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token tidak valid atau telah kadaluwarsa.' });
  }
};