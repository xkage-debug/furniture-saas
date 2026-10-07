const db = require('../config/db');

exports.getAllFurniture = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM furnitures WHERE tenant_id = ? ORDER BY id DESC',
      [req.user.tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFurniture = async (req, res) => {
  const { name, category, price, stock, is_po, dimensions, material, finishing, weight_kg, image_url } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO furnitures 
      (tenant_id, name, category, price, stock, is_po, dimensions, material, finishing, weight_kg, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.tenantId, name, category, price, stock, is_po ? 1 : 0, dimensions, material, finishing, weight_kg || 0, image_url || '']
    );
    res.json({ success: true, id: result.insertId, message: 'Furniture berhasil ditambahkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFurniture = async (req, res) => {
  const { id } = req.params;
  const { name, category, price, stock, is_po, dimensions, material, finishing, weight_kg, image_url } = req.body;
  try {
    await db.query(
      `UPDATE furnitures SET 
      name=?, category=?, price=?, stock=?, is_po=?, dimensions=?, material=?, finishing=?, weight_kg=?, image_url=? 
      WHERE id=? AND tenant_id=?`,
      [name, category, price, stock, is_po ? 1 : 0, dimensions, material, finishing, weight_kg, image_url, id, req.user.tenantId]
    );
    res.json({ success: true, message: 'Furniture berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFurniture = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM furnitures WHERE id = ? AND tenant_id = ?', [id, req.user.tenantId]);
    res.json({ success: true, message: 'Furniture berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// READ Public Furniture (Untuk E-Commerce Storefront)
exports.getPublicFurniture = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM furnitures ORDER BY id DESC LIMIT 20');
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};