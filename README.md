# SlotSwapper

A peer-to-peer time-slot scheduling application where users can swap their busy calendar slots with other users.

## Features

- **User Authentication**: Sign up and log in with JWT-based authentication
- **Calendar Management**: Create, update, and delete events on your calendar
- **Slot Swapping**: Mark events as swappable and request swaps with other users
- **Marketplace**: Browse available swappable slots from other users
- **Swap Requests**: Manage incoming and outgoing swap requests with accept/reject functionality
- **Real-time Updates**: Calendar updates automatically when swaps are accepted

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React with TypeScript
- React Router for navigation
- Axios for API calls
- Vite for build tooling

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Slot-Swapper
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create a .env file in the backend directory
# Copy the example and update with your database credentials:
# DATABASE_URL="mongodb://localhost:27017/slotswapper"
# JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
# PORT=3001

# Start the development server
npm run dev
```
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Database Schema

### User
- id (String, unique)
- name (String)
- email (String, unique)
- password (String, hashed)

### Event
- id (String, unique)
- title (String)
- startTime (DateTime)
- endTime (DateTime)
- status (BUSY | SWAPPABLE | SWAP_PENDING)
- userId (Foreign key to User)

### SwapRequest
- id (String, unique)
- requesterId (Foreign key to User)
- requestedId (Foreign key to User)
- requesterSlotId (Foreign key to Event)
- requestedSlotId (Foreign key to Event)
- status (PENDING | ACCEPTED | REJECTED)

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create a new user account
- `POST /api/auth/login` - Login and get JWT token

### Events
- `GET /api/events` - Get all events for the authenticated user
- `GET /api/events/:id` - Get a specific event
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Swaps
- `GET /api/swappable-slots` - Get all swappable slots from other users
- `POST /api/swap-request` - Create a swap request
- `POST /api/swap-response/:requestId` - Accept or reject a swap request
- `GET /api/swap-requests` - Get all swap requests (incoming and outgoing)

## Usage

1. **Sign Up**: Create a new account with your name, email, and password
2. **Create Events**: Go to the Calendar page and create events that you want to manage
3. **Make Slots Swappable**: Click "Make Swappable" on any BUSY event
4. **Browse Marketplace**: Visit the Marketplace to see available slots from other users
5. **Request Swaps**: Click "Request Swap" on a slot and select one of your swappable slots to offer
6. **Manage Requests**: Go to Notifications to accept or reject incoming swap requests

## Project Structure

```
Slot-Swapper/
├── backend/
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication middleware
│   │   └── server.ts       # Express server setup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts (Auth)
│   │   ├── services/      # API service functions
│   │   └── App.tsx        # Main app component
│   └── package.json
└── README.md
```

## Development

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT License

