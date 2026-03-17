const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── USER ──
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String },
  role:     { type: String, enum: ['buyer', 'admin'], default: 'buyer' },
  address: {
    street: String, city: String, state: String, zip: String, country: String,
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
userSchema.methods.matchPassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};
const User = mongoose.model('User', userSchema);

// ── PRODUCT ──
const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  brand:       { type: String, required: true, enum: ['Hot Wheels','Majorette','Matchbox','Tomica','Other'] },
  category:    { type: String, required: true, enum: ['sports','muscle','jdm','supercar','classic','limited'] },
  scale:       { type: String, default: '1:64' },
  condition:   { type: String, enum: ['Mint','Near Mint','Sealed','Used'], default: 'Mint' },
  price:       { type: Number, required: true, min: 0 },
  stock:       { type: Number, required: true, default: 1, min: 0 },
  images:      [String],
  description: String,
  series:      String,
  badge:       { type: String, enum: ['new','hot','limited',''], default: '' },
  featured:    { type: Boolean, default: false },
  sold:        { type: Number, default: 0 },
}, { timestamps: true });
const Product = mongoose.model('Product', productSchema);

// ── ORDER ──
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name:  String, brand: String, image: String,
  price: { type: Number, required: true },
  qty:   { type: Number, required: true, min: 1 },
});
const orderSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:   [orderItemSchema],
  shippingAddress: {
    name: String, street: String, city: String,
    state: String, zip: String, country: String, phone: String,
  },
  subtotal:        { type: Number, required: true },
  shipping:        { type: Number, default: 0 },
  total:           { type: Number, required: true },
  status:          { type: String, enum: ['pending','paid','processing','shipped','delivered','cancelled'], default: 'pending' },
  paymentIntentId: String,
  trackingNumber:  String,
  notes:           String,
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

module.exports = { User, Product, Order };
