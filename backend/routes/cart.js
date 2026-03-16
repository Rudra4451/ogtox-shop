const router = require('express').Router();
const { Product, User } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/cart/validate
router.post('/validate', protect, async (req, res) => {
  try {
    const results = [];
    for (const item of req.body.items || []) {
      const p = await Product.findById(item.product).select('name price stock images brand');
      if (!p) continue;
      results.push({ product: p._id, name: p.name, brand: p.brand, price: p.price, image: p.images[0]||'', availableQty: p.stock, requestedQty: item.qty, inStock: p.stock > 0 });
    }
    res.json(results);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/cart/buyers  [admin — list all buyers]
router.get('/buyers', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: 'buyer' }).select('-password').sort('-createdAt');
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
