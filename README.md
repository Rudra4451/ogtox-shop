# OGTOX Diecast Shop

Live site: https://rudra4451.github.io/ogtox-shop/

## Pages
- `/` → Main shop
- `/login.html` → Buyer login & register
- `/admin.html` → OGTOX admin dashboard

## Repo Structure
```
/                        ← GitHub Pages serves from here
├── index.html           ← Main shop page
├── login.html           ← Login & Register
├── admin.html           ← Admin dashboard
├── css/style.css
├── _config.yml          ← GitHub Pages config
└── backend/             ← Node.js API (deploy separately)
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── models/
    ├── routes/
    └── middleware/
```

## GitHub Pages Setup
Go to repo **Settings → Pages → Source → Deploy from branch → main → / (root)**

## Backend Setup (Railway / Render)
```bash
cd backend
npm install
cp .env.example .env   # fill in MongoDB URI, Stripe keys, etc.
npm run dev
```

See `.env.example` for all required environment variables.

## Database
- **MongoDB Atlas** (recommended, free): https://cloud.mongodb.com
- Local: `mongodb://localhost:27017/ogtox-shop`

## How OGTOX Sees Orders
1. Open `admin.html` and login as admin
2. See all orders, buyer details, shipping addresses
3. Automatic email notification on every new order (configure in `.env`)

## Make yourself admin (run in MongoDB):
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```
