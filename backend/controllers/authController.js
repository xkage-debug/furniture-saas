const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.registerTenant = async (req, res) => {
  const { storeName, adminName, email, password } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const domainSlug = storeName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const [tenantRes] = await conn.query('INSERT INTO tenants (name, domain_slug) VALUES (?, ?)', [storeName, domainSlug]);
    const tenantId = tenantRes.insertId;

    const hashedPassword = await bcrypt.hash(password, 10);
    const [userRes] = await conn.query(
      'INSERT INTO users (tenant_id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [tenantId, adminName, email, hashedPassword, 'admin']
    );

    await conn.commit();
    res.json({ success: true, message: 'Pendaftaran Toko SaaS Berhasil! Silakan Login.' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query(
      'SELECT u.*, t.name as store_name FROM users u JOIN tenants t ON u.tenant_id = t.id WHERE u.email = ?',
      [email]
    );
    if (users.length === 0) return res.status(404).json({ success: false, message: 'Email tidak ditemukan.' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Password salah.' });

    const token = jwt.sign(
      { userId: user.id, tenantId: user.tenant_id, role: user.role, storeName: user.store_name },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, storeName: user.store_name, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};