<!-- # bigbyt

A Vite React project.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173/`.

### Build

Build the project for production:
```bash
npm run build
```

### Preview

Preview the production build:
```bash
npm run preview
```

### Linting

Run ESLint:
```bash
npm run lint
``` -->


# 🔥 Bigbyt — Food Delivery Platform

A full-stack food delivery web application built with **React**, **Vite**, and **Supabase**. Users can browse restaurants near them, order food, track deliveries in real time, and receive notifications. Admins can manage restaurants, menus, orders, users, and send promotional campaigns.

---

## 📸 Features

### Customer App
- **Authentication** — Register with email + OTP verification, age gate (18+), login/logout
- **Restaurant Discovery** — Nearby restaurants shown first based on neighborhood, search and filter by cuisine
- **Per-Restaurant Menus** — Fixed menus with category tabs, popular badges, add/remove items
- **Cart & Checkout** — Multi-item cart, delivery fee breakdown, Google Places address autocomplete
- **Order Tracking** — 4-stage live tracking (Confirmed → Preparing → On the Way → Delivered) with Google Maps
- **Notifications** — Real-time in-app notifications via Supabase Realtime, unread badge on bell icon
- **Order History** — Full order history with status filters and order detail view
- **Settings** — Edit profile, saved addresses, change password (with old password verification), dietary preferences, notification preferences — all persisted to Supabase

### Admin Dashboard
- **Dashboard** — Live stats: today's orders, revenue, users, avg delivery time
- **Orders** — View all orders, advance status, cancel, view full order detail in modal
- **Restaurants** — Add new restaurants, edit details, open/close toggle
- **Menu Items** — Add items to any restaurant, edit, hide/show, filter by restaurant
- **Users** — View all registered users with profile details
- **Reviews** — Moderate reviews, filter by rating, remove inappropriate content
- **Analytics** — 30-day order and revenue totals, top restaurants by order volume
- **Notification Campaigns** — Create targeted promo campaigns, send in-app and/or email, target all users / restaurant customers / food category fans
- **Settings** — Platform config

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend / Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (Email + OTP) |
| Realtime | Supabase Realtime (Postgres Changes) |
| Email | Resend SMTP |
| Maps | Google Maps JavaScript API + Places API |
| Edge Functions | Supabase Edge Functions (Deno) |
| Deployment | Netlify |

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.jsx              # Top nav with realtime notification badge
│   ├── Footer.jsx              # Bottom nav (mobile) / footer bar (desktop)
│   ├── RestaurantCard.jsx      # Restaurant preview card
│   ├── DeliveryMap.jsx         # Google Maps delivery tracking
│   └── AddressInput.jsx        # Google Places autocomplete
│
├── constants/
│   └── colors.js               # Design token colors
│
├── context/
│   ├── AuthContext.jsx          # User session, profile, login/register/OTP
│   └── CartContext.jsx          # Cart state, checkout
│
├── hooks/
│   ├── useAdmin.js              # Admin role check
│   ├── useGeolocation.js        # Browser geolocation + reverse geocoding
│   └── useNotifications.js      # Realtime unread count
│
├── lib/
│   └── supabase.js              # Supabase client (single instance)
│
├── pages/
│   ├── Auth.jsx                 # Register, VerifyOTP, Login
│   ├── Landing.jsx              # Public landing page
│   ├── Home.jsx                 # Authenticated home dashboard
│   ├── Restaurants.jsx          # Restaurant list with nearby sort + search
│   ├── RestaurantMenu.jsx       # Per-restaurant menu page
│   ├── Cart.jsx                 # Cart review page
│   ├── Checkout.jsx             # Checkout with address + payment
│   ├── Tracking.jsx             # Live order tracking with map
│   ├── Orders.jsx               # Order history + order detail
│   ├── Notifications.jsx        # Notifications list
│   ├── Settings.jsx             # All settings sub-screens
│   ├── Admin.jsx                # Full admin dashboard
│   └── AdminCampaigns.jsx       # Notification campaign management
│
├── services/
│   ├── authService.js           # Register, OTP verify, login, profile CRUD
│   ├── restaurantService.js     # Fetch restaurants and menus
│   ├── orderService.js          # Place orders, track, history, realtime
│   ├── addressService.js        # Saved addresses CRUD
│   ├── adminService.js          # All admin Supabase queries
│   └── notificationService.js   # Notifications CRUD + campaigns + realtime
│
└── App.jsx                      # Root router + providers

supabase/
└── functions/
    └── send-campaign/
        └── index.ts             # Edge Function: fan out notification campaigns

database/
├── schema.sql                   # Full database schema + RLS + triggers
├── notifications_schema.sql     # Notifications tables + triggers
└── migration_settings.sql       # Profile columns for settings persistence
```

---

## 🗄 Database Tables

| Table | Purpose |
|---|---|
| `profiles` | Extended user data (name, DOB, phone, preferences) |
| `addresses` | Saved delivery addresses per user |
| `restaurants` | Restaurant listings with location, hours, fees |
| `menu_categories` | Category groups per restaurant |
| `menu_items` | Individual food items |
| `orders` | Customer orders with status lifecycle |
| `order_items` | Line items snapshot per order |
| `reviews` | Customer reviews per restaurant |
| `notifications` | Per-user notification rows |
| `notification_campaigns` | Admin promo campaigns |

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# App
VITE_APP_URL=http://localhost:5173

# Google Maps
VITE_GOOGLE_MAPS_KEY=your-google-maps-api-key

# Defaults (for neighborhood-based sorting)
VITE_DEFAULT_CITY=Buea
VITE_DEFAULT_NEIGHBORHOOD=Molyko
```

**Never commit `.env` to Git.** It is already in `.gitignore`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))
- A Resend account for email ([resend.com](https://resend.com))
- A Google Cloud project with Maps + Places APIs enabled

### 1. Clone and install

```bash
git clone https://github.com/Ngong-Brandon/BIGBYT.git
cd BIGBYT
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run these files in order:
   - `database/schema.sql`
   - `database/notifications_schema.sql`
   - `database/migration_settings.sql`
3. Go to **Authentication → Providers → Email** and enable **Confirm email**
4. Set up SMTP under **Project Settings → Auth → SMTP Settings** using Resend

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your values
```

### 4. Run locally

```bash
npm run dev
# App runs at http://localhost:5173
```

### 5. Deploy Edge Function

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase secrets set RESEND_API_KEY=re_your_key
supabase functions deploy send-campaign
```

---

## 🔐 Admin Access

To grant admin access, open `src/hooks/useAdmin.js` and add your email:

```js
const ADMIN_EMAILS = [
  "your-email@gmail.com",
];
```

Also update the RLS policies in `notifications_schema.sql` and `schema.sql` with the same email before running them.

Access the admin dashboard from **Settings → Admin Panel** when logged in with an admin account.

---

## 🗺 Google Maps Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project → Enable:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**
3. Create an API key → add to `.env` as `VITE_GOOGLE_MAPS_KEY`

---

## 📧 Email Setup (Resend)

1. Create account at [resend.com](https://resend.com)
2. Get your API key
3. In Supabase → **Project Settings → Auth → SMTP Settings**:

```
Host:         smtp.resend.com
Port:         465
Username:     resend
Password:     your-resend-api-key
Sender email: onboarding@resend.dev   (or your verified domain)
Sender name:  Bigbyt
```

For production, add and verify your own domain in Resend to send to any email address.

---

## 🌐 Deploying to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) → **New site from Git**
3. Select your repo and set:
   ```
   Build command:   npm run build
   Publish dir:     dist
   ```
4. Add all environment variables under **Site Settings → Environment Variables**
5. Add `netlify.toml` to your project root:
   ```toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```
6. In Supabase → **Authentication → URL Configuration**, add your Netlify URL to redirect URLs

---

## 📱 Notification System

### Automatic (System)
Triggered by database changes — no code needed on the frontend:
- ✅ **Order confirmed** — fires when order status → `confirmed`
- 👨‍🍳 **Preparing** — fires when status → `preparing`
- 🛵 **On the way** — fires when status → `on_the_way`
- 🏠 **Delivered** — fires when status → `delivered`
- 💳 **Payment success** — fires when `payment_status` → `paid`

### Admin Campaigns (Promotional)
- Admin creates campaign with title, message, icon
- Picks audience: All users / Restaurant customers / Category fans
- Picks channels: In-app / Email
- Clicks Send — Edge Function handles fan-out to all matched users

---

## 🔄 Order Status Flow

```
pending → confirmed → preparing → on_the_way → delivered
                                              → cancelled
```

Status advances are triggered by the admin from the Orders section of the dashboard.

---

## 🐛 Known Issues & Notes

- **Email OTP on free Supabase plan** — Supabase's built-in mailer is rate-limited to 3 emails/hour. Set up Resend SMTP for reliable delivery.
- **Realtime notifications** — Requires the `notifications` table to be added to `supabase_realtime` publication (done in schema).
- **Google Maps** — Delivery map only shows during `on_the_way` status. Rider location is simulated in demo mode; wire to a real rider app for production.
- **Payments** — Currently uses a mock card form. Integrate Paystack (recommended for Nigeria) or Stripe for real payments.

---

## 🗺 Roadmap

- [ ] Paystack / Stripe payment integration
- [ ] Rider mobile app with live location updates
- [ ] Push notifications (web push / PWA)
- [ ] Multi-city support
- [ ] Loyalty points system
- [ ] Restaurant owner dashboard (separate from admin)
- [ ] Order scheduling (order for later)

---

## 👨‍💻 Built By

**Brandon Ngong** — [@Ngong-Brandon](https://github.com/Ngong-Brandon)

Built with 🔥 using React, Supabase, and Claude AI assistance.

---

## 📄 License

MIT — feel free to use, modify and build on this project.