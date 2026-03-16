# 🏁 OGTOX Diecast Shop

Full-stack diecast car e-commerce site for OGTOX.

---

## Files

```
ogtox-shop/
├── frontend/
│   ├── index.html      ← Main shop page
│   ├── login.html      ← Buyer login & register
│   ├── admin.html      ← OGTOX admin dashboard
│   └── css/
│       └── style.css
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example    ← Copy to .env and fill in
    ├── models/
    │   └── index.js    ← User, Product, Order schemas
    ├── routes/
    │   ├── auth.js
    │   ├── products.js
    │   ├── orders.js
    │   └── cart.js
    └── middleware/
        └── auth.js
```

---

## Quick Setup

### Step 1 — Backend
```bash
cd backend
npm install
cp .env.example .env
# Open .env and fill in MongoDB URI, JWT secret, etc.
npm run dev
```

### Step 2 — Frontend
Open `frontend/index.html` in browser.
Or serve with: `npx serve frontend`

---

## WHERE IS THE DATABASE SAVED?

You have two options — configured in your `.env` file:

### Option A: MongoDB Atlas (Recommended — Free Cloud)
1. Go to https://cloud.mongodb.com
2. Sign up free → Create a cluster (free tier)
3. Click **Connect** → **Drivers** → copy the URI
4. Paste it as `MONGODB_URI` in your `.env`
5. Data is saved in the cloud — accessible from anywhere

### Option B: Local MongoDB
1. Install MongoDB Community: https://www.mongodb.com/try/download/community
2. Run `mongod` in terminal
3. Set `MONGODB_URI=mongodb://localhost:27017/ogtox-shop`
4. Data saved on your own computer

> **Recommendation: Use MongoDB Atlas.** It's free, works on any computer,
> and you won't lose data if your laptop crashes.

---

## HOW DOES OGTOX (THE SELLER) SEE ORDERS?

### Method 1 — Admin Dashboard (admin.html)
- Open `frontend/admin.html`
- Login with admin credentials
- See all orders with buyer names, addresses, phone numbers, items ordered
- Update order status (pending → shipped → delivered)
- Add/remove products from the shop
- See all registered buyers

### Method 2 — Email Notifications (automatic)
When a buyer places an order, the backend automatically sends an email to OGTOX with:
- Buyer's full name, email, phone number
- Complete shipping address
- Every item ordered with quantities and prices
- Total amount paid

To enable email notifications, set these in `.env`:
```
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your_gmail_app_password   ← Generate at myaccount.google.com → Security → App Passwords
ADMIN_EMAIL=ogtox@gmail.com          ← Where notifications are sent
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Buyer registers |
| POST | `/api/auth/login` | Buyer/admin login |
| GET  | `/api/auth/me` | Get current user |
| GET  | `/api/products` | List products |
| POST | `/api/products` | Add product (admin) |
| PUT  | `/api/products/:id` | Edit product (admin) |
| DELETE | `/api/products/:id` | Delete product (admin) |
| POST | `/api/orders/create-payment-intent` | Stripe checkout |
| POST | `/api/orders` | Place order |
| GET  | `/api/orders/my` | My orders (buyer) |
| GET  | `/api/orders` | All orders (admin) |
| PATCH | `/api/orders/:id/status` | Update order status (admin) |

---

## Deployment (to go live)

### Easiest: Railway.app (free tier)
1. Push this repo to GitHub
2. Go to https://railway.app → New Project → Deploy from GitHub
3. Add a MongoDB plugin in Railway (or use Atlas URI)
4. Set all env variables in Railway dashboard
5. Done — your site is live!

### Frontend only: Netlify
1. Drag & drop the `frontend/` folder at https://app.netlify.com
2. Update `CLIENT_URL` in your backend env to your Netlify URL

---

## Making OGTOX an Admin
After starting the backend, register normally, then in MongoDB:
```
db.users.updateOne({ email: "ogtox@gmail.com" }, { $set: { role: "admin" } })
```
Or use MongoDB Compass (free GUI app) to change the role field.
