const router    = require('express').Router();
const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const { Order, Product } = require('../models');
const { protect, adminOnly } = require('../middleware/auth');

// ── EMAIL SETUP ──
// Sends order notification to OGTOX so he sees every new order
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

async function notifyAdmin(order, buyer) {
  if (!process.env.EMAIL_USER || !process.env.ADMIN_EMAIL) return; // skip if not configured
  try {
    const itemLines = order.items.map(i => `• ${i.brand} — ${i.name}  x${i.qty}  $${(i.price*i.qty).toFixed(2)}`).join('\n');
    await transporter.sendMail({
      from: `"OGTOX Shop" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🏁 New Order #${order._id} — $${order.total.toFixed(2)}`,
      text: `
NEW ORDER RECEIVED
==================
Order ID : ${order._id}
Date     : ${new Date().toLocaleString()}

BUYER
-----
Name    : ${buyer.name}
Email   : ${buyer.email}
Phone   : ${order.shippingAddress.phone || 'N/A'}

SHIPPING ADDRESS
----------------
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
${order.shippingAddress.country}

ITEMS ORDERED
-------------
${itemLines}

Subtotal : $${order.subtotal.toFixed(2)}
Shipping : ${order.shipping === 0 ? 'FREE' : '$'+order.shipping.toFixed(2)}
TOTAL    : $${order.total.toFixed(2)}

View in Admin: ${process.env.CLIENT_URL || 'http://localhost:5000'}/admin.html
      `.trim(),
    });
    console.log(`Order notification sent to ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error('Email notification failed:', err.message);
    // Non-critical — don't fail the order
  }
}

// POST /api/orders/create-payment-intent
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { items } = req.body;
    let subtotal = 0;
    for (const item of items) {
      const p = await Product.findById(item.product);
      if (!p || p.stock < item.qty)
        return res.status(400).json({ message: `${p?.name || 'Item'} is out of stock` });
      subtotal += p.price * item.qty;
    }
    const shipping = subtotal >= 30 ? 0 : 4.99;
    const total    = Math.round((subtotal + shipping) * 100);
    const pi = await stripe.paymentIntents.create({
      amount: total, currency: 'usd',
      metadata: { userId: req.user._id.toString() },
    });
    res.json({ clientSecret: pi.client_secret, subtotal, shipping, total: subtotal + shipping });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/orders  — place order after payment
router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentIntentId } = req.body;

    // Verify Stripe payment
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (pi.status !== 'succeeded')
      return res.status(400).json({ message: 'Payment not completed' });

    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const p = await Product.findById(item.product);
      if (!p) return res.status(404).json({ message: 'Product not found' });
      orderItems.push({ product: p._id, name: p.name, brand: p.brand, price: p.price, qty: item.qty, image: p.images[0] || '' });
      subtotal += p.price * item.qty;
      await Product.findByIdAndUpdate(p._id, { $inc: { stock: -item.qty, sold: item.qty } });
    }

    const shipping = subtotal >= 30 ? 0 : 4.99;
    const order = await Order.create({
      user: req.user._id, items: orderItems, shippingAddress,
      subtotal, shipping, total: subtotal + shipping,
      status: 'paid', paymentIntentId,
    });

    // Notify OGTOX by email
    await notifyAdmin(order, req.user);

    res.status(201).json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/my
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders  [admin]
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().sort('-createdAt').populate('user', 'name email phone');
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/orders/:id  [admin]
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PATCH /api/orders/:id/status  [admin]
router.patch('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, ...(trackingNumber && { trackingNumber }) },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
