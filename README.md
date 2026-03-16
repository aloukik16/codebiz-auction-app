# CodeBidz

A real-time auction platform built for the CodeBidz Hackathon. Place bids, win items, and manage auctions — all powered by live Firestore updates.

---

## Tech Stack

- **Frontend** — React + Vite
- **Auth** — Firebase Authentication
- **Database** — Cloud Firestore
- **Routing** — React Router v6
- **Styling** — Tailwind CSS + inline styles

---

## Features

### Bidder
- Register and login securely
- Browse live auctions with real-time countdown timers
- Place bids using credits — validated instantly
- Credits refunded automatically when outbid
- Real-time notifications for outbid and win events
- Personal bid history with Win / Lost / Winning status

### Admin
- Create auctions with title, description, image, start time, and end time
- Assign credits to any bidder by email
- Monitor all live bids across auctions in real time
- Close auctions manually — winner declared automatically
- Full bid reports per auction with winner highlighted
- Dashboard overview — total auctions, bids, and users

### Credits System
- Every new bidder receives 100 credits on signup
- Bids processed as Firestore atomic transactions — no race conditions
- Previous highest bidder refunded instantly when outbid
- Winner's credits deducted when auction closes

---

## Getting Started

**1. Clone the repo**
```bash
git clone https://github.com/your-username/codebidz.git
cd codebidz
```

**2. Install dependencies**
```bash
npm install
```

**3. Add Firebase config**

Create `src/services/firebase.js` and paste your Firebase project config:

```js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
```

**4. Run the app**
```bash
npm run dev
```

---

## Creating an Admin Account

1. Register normally through `/register`
2. Open **Firebase Console → Firestore → users collection**
3. Find your user document by UID
4. Add a field: `role` = `"admin"` (string type)

You can now access `/admin` from the navbar.

---

## Project Structure

```
src/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── MyBids.jsx
│   ├── AdminDashboard.jsx
│   └── AdminCreateAuction.jsx
├── components/
│   ├── AuctionCard.jsx
│   ├── BidHistory.jsx
│   ├── Navbar.jsx
│   └── Notifications.jsx
├── services/
│   └── firebase.js
├── App.jsx
└── index.css
```

---

## Known Limitations

- No email verification on registration
- Admin role must be set manually via Firebase Console
- No image upload — image URLs only
- No proxy or auto-increment bidding

---

## Built By

**Aloukik Agrawal** — [unstop.com/u/Aloukik16](https://unstop.com/u/Aloukik16)  
Team: **Ctrl Alt Elite**
