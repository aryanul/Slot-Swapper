# Quick Start Guide

Follow these steps to get SlotSwapper up and running:

## 1. Database Setup

Make sure MongoDB is installed and running, or use MongoDB Atlas.

**For Local MongoDB:**
- Install MongoDB Community Edition
- Start MongoDB service (usually runs automatically on port 27017)

**For MongoDB Atlas (Cloud):**
- Sign up at https://www.mongodb.com/cloud/atlas
- Create a free cluster
- Get your connection string from the cluster settings

## 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example and update)
# For local MongoDB:
# DATABASE_URL="mongodb://localhost:27017/slotswapper"
# For MongoDB Atlas:
# DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority"
# JWT_SECRET="your-secret-key-here"
# PORT=3001

# Start server
npm run dev
```
```

Backend should be running on `http://localhost:3001`

## 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend should be running on `http://localhost:3000`

## 4. Test the Application

1. Open `http://localhost:3000` in your browser
2. Sign up with a new account
3. Create some events in the Calendar
4. Mark events as "Swappable"
5. Visit the Marketplace to see other users' swappable slots
6. Request a swap and check Notifications

## Troubleshooting

- **Database connection error**: Make sure MongoDB is running and the DATABASE_URL in `.env` is correct. For MongoDB Atlas, ensure your IP is whitelisted and credentials are correct.
- **Port already in use**: Change the PORT in backend `.env` or frontend `vite.config.ts`
- **MongoDB connection string format**: Ensure your connection string is properly formatted. Local: `mongodb://localhost:27017/slotswapper`, Atlas: `mongodb+srv://user:password@cluster.mongodb.net/slotswapper`

