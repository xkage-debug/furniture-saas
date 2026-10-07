const db = require('../config/db');

exports.createOrder = async (req, res) => {
  const { customerName, items } = req.body; // items: [{ furnitureId, qty, price }]
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const invoiceNum = 'INV-' + Date.now();
    let totalAmount = 0;
    items.forEach(item => { totalAmount += item.price * item.qty; });

    const [orderRes] = await conn.query(
      'INSERT INTO orders (tenant_id, invoice_number, customer_name, total_amount, status) VALUES (?, ?, ?, ?, ?)',
      [req.user.tenantId, invoiceNum, customerName, totalAmount, 'paid']
    );

    for (let item of items) {
      await conn.query(
        'INSERT INTO order_items (order_id, furniture_id, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [orderRes.insertId, item.furnitureId, item.qty, item.price, item.price * item.qty]
      );
      // Potong stok
      await conn.query('UPDATE furnitures SET stock = stock - ? WHERE id = ? AND tenant_id = ?', [item.qty, item.furnitureId, req.user.tenantId]);
    }

    await conn.commit();
    res.json({ success: true, invoiceNumber: invoiceNum, message: 'Transaksi berhasil dibuat' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: err.message });
  } finally {
    conn.release();
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE tenant_id = ? ORDER BY id DESC', [req.user.tenantId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};