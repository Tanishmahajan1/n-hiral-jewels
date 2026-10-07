# Hiral Jewels — Clean Full-Stack React Project

## Stack
- Frontend: React 18 + Vite + React Router
- Backend: Node.js + Express
- Database: SQLite
- Authentication: JWT + bcrypt
- Product CRUD: Add / Edit / Delete
- Admin dashboard
- Customer storefront
- Enquiry/order-ready API

## Demo admin
Username: `admin`
Password: `admin123`

Change these before production.

## Run

Requirements: Node.js 18+ and npm.

From the project root:

```bash
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

Or run separately:

```bash
npm run server
npm run client
```

The SQLite database is created automatically in:
`server/data/hiral-jewels.sqlite`

## Production notes
Set `JWT_SECRET` in the server environment and replace the demo admin credentials.

## Customer pages
- `/` Home
- `/collection` Collection
- `/product/:id` Individual product page
- `/about` Our Story
- `/contact` Contact / enquiry form
- `/admin` Admin login
- `/admin/dashboard` Admin dashboard

## Brand logo
The supplied Hiral Jewels logo is included at `client/public/hiral-jewels-logo.png` and is used in the customer header, product/detail pages, footer, admin login, admin dashboard, and browser favicon.


## WhatsApp inquiries
Set your business WhatsApp number in `client/.env` (international format, digits only), for example:
`VITE_WHATSAPP_NUMBER=919876543210`
The customer-facing product prices are replaced by WhatsApp inquiry buttons. The admin product form still keeps the price field for internal catalog management.

## Live metal prices
The header shows indicative live gold and silver spot prices, refreshed every 60 seconds. The header now uses IBJA (India Bullion and Jewellers Association) indicative AM rates: 24K/999 gold per 10g and 999 silver per kg. The server refreshes the IBJA source every 5 minutes and shows the rate date. IBJA rates exclude GST and making charges.

## Shopping Bag & Email Enquiry
- Click **Add to Bag** on any product.
- Click **Bag (N)** in the header to open `/bag`.
- Enter customer name and phone, then **Send Bag by Email**.
- The backend emails the selected products to `tanishmahajan1997@gmail.com` when SMTP is configured.
- Copy `server/.env.example` to `server/.env` and configure Gmail SMTP using a Google App Password (do not use your normal Gmail password).
