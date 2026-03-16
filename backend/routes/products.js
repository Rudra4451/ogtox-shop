const router = require('express').Router();
const multer = require('multer');
const fs     = require('fs');
const { Product } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/products';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g,'_')}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { brand, category, search, sort, page = 1, limit = 16 } = req.query;
    const q = {};
    if (brand)    q.brand    = brand;
    if (category) q.category = category;
    if (search)   q.name = { $regex: search, $options: 'i' };
    const sortMap = { newest:'-createdAt', 'price-asc':'price', 'price-desc':'-price' };
    const total    = await Product.countDocuments(q);
    const products = await Product.find(q).sort(sortMap[sort] || '-createdAt').skip((page-1)*limit).limit(+limit);
    res.json({ products, total, pages: Math.ceil(total/limit), page: +page });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try { res.json(await Product.find({ featured: true }).limit(8)); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/products  [admin only]
router.post('/', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const images = (req.files || []).map(f => `/uploads/products/${f.filename}`);
    const product = await Product.create({ ...req.body, images });
    res.status(201).json(product);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/products/:id  [admin only]
router.put('/:id', protect, adminOnly, upload.array('images', 5), async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.files?.length) data.images = req.files.map(f => `/uploads/products/${f.filename}`);
    const p = await Product.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json(p);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/products/:id  [admin only]
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const p = await Product.findByIdAndDelete(req.params.id);
    if (!p) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
