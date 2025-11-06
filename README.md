# SlotSwapper

A peer-to-peer time-slot scheduling application where users can swap their busy calendar slots with other users. Built with React, Node.js, Express, and MongoDB.

## 📋 Table of Contents

- [Overview](#overview)
- [Design Choices](#design-choices)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Assumptions & Challenges](#assumptions--challenges)
- [Docker Deployment](#docker-deployment)
- [License](#license)

## Overview

SlotSwapper is a full-stack web application that enables users to manage their calendars and swap time slots with other users. The core concept is simple: users can mark their busy slots as "swappable," and other users can request to swap their own swappable slots for them. This creates a peer-to-peer marketplace for time slot exchanges.

### Key Use Cases

- **Calendar Management**: Users can create, update, and delete calendar events
- **Slot Swapping**: Mark events as swappable and browse available slots from other users
- **Swap Requests**: Send and receive swap requests with accept/reject functionality
- **Calendar Import**: Import events from external calendar applications (iCal/ICS or CSV)

## Design Choices

### Backend Architecture

1. **MongoDB with Mongoose**: Chose MongoDB for its flexibility with document-based storage, which suits the dynamic nature of calendar events and swap requests. Mongoose provides schema validation and type safety.

2. **TypeScript**: Used TypeScript throughout the backend for type safety, better IDE support, and improved maintainability.

3. **JWT Authentication**: Implemented stateless JWT-based authentication for scalability and simplicity. Tokens expire after 7 days for security.

4. **RESTful API Design**: Followed REST principles with clear endpoint naming and HTTP method usage.

5. **Zod Validation**: Used Zod for runtime schema validation to ensure data integrity and provide clear error messages.

6. **File Upload Handling**: Used Multer for handling calendar file imports (ICS/iCal and CSV) with memory storage for efficiency.

### Frontend Architecture

1. **React with TypeScript**: Leveraged React for component-based UI development and TypeScript for type safety across the frontend.

2. **Vite**: Used Vite as the build tool for fast development experience and optimized production builds.

3. **React Router**: Implemented client-side routing for a single-page application experience.

4. **Context API**: Used React Context for global state management (authentication and theme).

5. **Axios**: Used Axios for API calls with interceptors to automatically attach JWT tokens.

6. **Responsive Design**: Implemented a mobile-first responsive design with hamburger menu for mobile navigation.

7. **Dark Mode**: Built-in dark/light mode toggle with system preference detection and localStorage persistence.

### UI/UX Design

1. **Modern Aesthetic**: Created a vibrant, engaging UI with gradients, glassmorphism effects, and smooth animations.

2. **User-Friendly**: Clear visual hierarchy, intuitive navigation, and immediate feedback for user actions.

3. **Accessibility**: Ensured proper contrast ratios, readable fonts, and keyboard navigation support.

4. **Performance**: Optimized images, lazy loading, and efficient state management for fast load times.

## Features

- ✅ **User Authentication**: Secure sign up and login with JWT tokens
- ✅ **Calendar Management**: Full CRUD operations for events
- ✅ **Event Status System**: Events can be BUSY, SWAPPABLE, or SWAP_PENDING
- ✅ **Swap Marketplace**: Browse available swappable slots from other users
- ✅ **Swap Requests**: Create, accept, and reject swap requests
- ✅ **Calendar Import**: Import events from iCal/ICS or CSV files
- ✅ **Real-time Updates**: Automatic calendar refresh when swaps are accepted
- ✅ **Dark Mode**: Toggle between light and dark themes
- ✅ **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- ✅ **Auto-refresh**: Marketplace and notifications update automatically

## Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Zod
- **File Upload**: Multer
- **Calendar Parsing**: ical.js
- **CSV Parsing**: csv-parser

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Styling**: CSS with custom properties
- **Fonts**: Google Fonts (Inter, Space Grotesk)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18 or higher ([Download](https://nodejs.org/))
- **npm**: v9 or higher (comes with Node.js)
- **MongoDB**: 
  - Local installation ([Download](https://www.mongodb.com/try/download/community)) OR
  - MongoDB Atlas account ([Sign up](https://www.mongodb.com/cloud/atlas/register))

## Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Slot-Swapper
```

### Step 2: Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the `backend` directory:
   ```env
   DATABASE_URL=mongodb://localhost:27017/slotswapper
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3001
   ```

   **For MongoDB Atlas**, use your connection string:
   ```env
   DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority
   ```

   **Important**: The database name (`slotswapper`) must be included in the connection string!

4. **Start the development server**:
   ```bash
   npm run dev
   ```

   The backend server will start on `http://localhost:3001`

### Step 3: Frontend Setup

1. **Open a new terminal** and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

### Step 4: Verify Setup

1. Open your browser and navigate to `http://localhost:3000`
2. You should see the login page
3. Create a new account or log in with existing credentials
4. The application should be fully functional!

## API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication

All endpoints except `/auth/signup` and `/auth/login` require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Authentication Endpoints

##### POST `/api/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `400`: User already exists or validation error
- `500`: Server error

---

##### POST `/api/auth/login`
Login and receive JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses:**
- `401`: Invalid credentials
- `500`: Server error

---

#### Event Endpoints

##### GET `/api/events`
Get all events for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Team Meeting",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "status": "BUSY",
    "userId": "507f1f77bcf86cd799439012"
  }
]
```

---

##### GET `/api/events/:id`
Get a specific event by ID.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "BUSY",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Error Responses:**
- `404`: Event not found
- `403`: Event does not belong to user

---

##### POST `/api/events`
Create a new event.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "BUSY"
}
```

**Note**: `status` is optional and defaults to `"BUSY"`. Valid values: `"BUSY"`, `"SWAPPABLE"`, `"SWAP_PENDING"`.

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00.000Z",
  "endTime": "2024-01-15T11:00:00.000Z",
  "status": "BUSY",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Error Responses:**
- `400`: Validation error
- `500`: Server error

---

##### PUT `/api/events/:id`
Update an existing event.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated Meeting",
  "startTime": "2024-01-15T11:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "status": "SWAPPABLE"
}
```

**Response (200):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Updated Meeting",
  "startTime": "2024-01-15T11:00:00.000Z",
  "endTime": "2024-01-15T12:00:00.000Z",
  "status": "SWAPPABLE",
  "userId": "507f1f77bcf86cd799439012"
}
```

**Error Responses:**
- `400`: Validation error
- `403`: Event does not belong to user
- `404`: Event not found

---

##### DELETE `/api/events/:id`
Delete an event.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Event deleted successfully"
}
```

**Error Responses:**
- `403`: Event does not belong to user
- `404`: Event not found

---

#### Swap Endpoints

##### GET `/api/swappable-slots`
Get all swappable slots from other users (excludes current user's slots).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Available Slot",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z",
    "status": "SWAPPABLE",
    "userId": "507f1f77bcf86cd799439012",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
]
```

---

##### POST `/api/swap-request`
Create a swap request.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "mySlotId": "507f1f77bcf86cd799439013",
  "theirSlotId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "requesterId": "507f1f77bcf86cd799439012",
  "requestedId": "507f1f77bcf86cd799439015",
  "requesterSlotId": "507f1f77bcf86cd799439013",
  "requestedSlotId": "507f1f77bcf86cd799439011",
  "status": "PENDING",
  "requester": {
    "id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "requested": {
    "id": "507f1f77bcf86cd799439015",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "requesterSlot": {
    "id": "507f1f77bcf86cd799439013",
    "title": "My Available Slot",
    "startTime": "2024-01-16T10:00:00.000Z",
    "endTime": "2024-01-16T11:00:00.000Z"
  },
  "requestedSlot": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Their Available Slot",
    "startTime": "2024-01-15T10:00:00.000Z",
    "endTime": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Invalid slot IDs or validation error
- `404`: One or both slots not found
- `403`: One or both slots don't belong to the correct users
- `409`: Slot already has a pending swap request

---

##### POST `/api/swap-response/:requestId`
Accept or reject a swap request.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "accepted": true
}
```

**Response (200):**
```json
{
  "message": "Swap request accepted",
  "swapRequest": {
    "id": "507f1f77bcf86cd799439014",
    "status": "ACCEPTED",
    ...
  }
}
```

**Note**: When a swap is accepted:
- Both slots' statuses are updated to `SWAP_PENDING`
- The requester's slot's `startTime` and `endTime` are swapped with the requested slot's times
- The requested user's slot's `startTime` and `endTime` are swapped with the requester's slot's times

**Error Responses:**
- `400`: Invalid request body
- `403`: User is not the requested user
- `404`: Swap request not found
- `409`: Swap request already processed

---

##### GET `/api/swap-requests`
Get all swap requests (incoming and outgoing) for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "incoming": [
    {
      "id": "507f1f77bcf86cd799439014",
      "status": "PENDING",
      "requester": {
        "id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "requesterSlot": {
        "id": "507f1f77bcf86cd799439013",
        "title": "John's Slot",
        "startTime": "2024-01-16T10:00:00.000Z",
        "endTime": "2024-01-16T11:00:00.000Z"
      },
      "requestedSlot": {
        "id": "507f1f77bcf86cd799439011",
        "title": "My Slot",
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T11:00:00.000Z"
      }
    }
  ],
  "outgoing": [
    {
      "id": "507f1f77bcf86cd799439015",
      "status": "PENDING",
      "requested": {
        "id": "507f1f77bcf86cd799439016",
        "name": "Jane Doe",
        "email": "jane@example.com"
      },
      "requesterSlot": {
        "id": "507f1f77bcf86cd799439017",
        "title": "My Slot",
        "startTime": "2024-01-16T10:00:00.000Z",
        "endTime": "2024-01-16T11:00:00.000Z"
      },
      "requestedSlot": {
        "id": "507f1f77bcf86cd799439018",
        "title": "Jane's Slot",
        "startTime": "2024-01-15T10:00:00.000Z",
        "endTime": "2024-01-15T11:00:00.000Z"
      }
    }
  ]
}
```

---

#### Import Endpoint

##### POST `/api/import/calendar`
Import calendar events from a file (ICS/iCal or CSV).

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body:**
- Form field: `file` (file upload)
- Accepted formats: `.ics`, `.ical`, `.csv`
- Maximum file size: 10MB

**Response (200):**
```json
{
  "message": "Calendar imported successfully",
  "imported": 5,
  "skipped": 2
}
```

**Error Responses:**
- `400`: Invalid file type or no file provided
- `413`: File too large
- `500`: Server error during parsing

**Note**: 
- Past events (more than 1 hour ago) are automatically filtered out
- Duplicate events (same start time within 1 minute) are skipped
- Invalid date formats are skipped

---

#### Health Check Endpoint

##### GET `/health`
Check if the server is running.

**Response (200):**
```json
{
  "status": "ok"
}
```

---

## Project Structure

```
Slot-Swapper/
├── backend/
│   ├── src/
│   │   ├── models/              # Mongoose models (User, Event, SwapRequest)
│   │   ├── routes/              # API route handlers
│   │   │   ├── auth.ts         # Authentication endpoints
│   │   │   ├── events.ts       # Event CRUD endpoints
│   │   │   ├── swaps.ts        # Swap logic endpoints
│   │   │   └── import.ts       # Calendar import endpoint
│   │   ├── middleware/         # Express middleware
│   │   │   └── auth.ts        # JWT authentication middleware
│   │   └── server.ts           # Express server setup
│   ├── Dockerfile              # Backend Docker configuration
│   ├── .dockerignore           # Docker ignore file
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   │   ├── Layout.tsx     # Main layout with navigation
│   │   │   └── ThemeToggle.tsx # Dark/light mode toggle
│   │   ├── pages/              # Page components
│   │   │   ├── Login.tsx      # Login page
│   │   │   ├── Signup.tsx     # Signup page
│   │   │   ├── Dashboard.tsx  # Calendar management page
│   │   │   ├── Marketplace.tsx # Browse swappable slots
│   │   │   └── Notifications.tsx # Swap requests page
│   │   ├── contexts/           # React contexts
│   │   │   ├── AuthContext.tsx # Authentication context
│   │   │   └── ThemeContext.tsx # Theme context
│   │   ├── services/           # API service functions
│   │   │   └── api.ts         # Axios API client
│   │   ├── App.tsx             # Main app component
│   │   └── main.tsx            # Entry point
│   ├── Dockerfile              # Frontend Docker configuration
│   ├── .dockerignore           # Docker ignore file
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── docker-compose.yml          # Docker Compose configuration
├── README.DOCKER.md            # Docker deployment guide
└── README.md                   # This file
```

## Assumptions & Challenges

### Assumptions

1. **User Behavior**:
   - Users understand that swapping slots means exchanging time periods
   - Users will mark slots as swappable before browsing the marketplace
   - Users can only have one pending swap request per slot

2. **Data Integrity**:
   - MongoDB connection is reliable and persistent
   - JWT tokens are stored securely in localStorage (client-side)
   - File uploads are temporary and don't require persistent storage

3. **Time Handling**:
   - All times are stored in UTC and converted to user's local timezone in the frontend
   - Past events (1+ hour ago) are filtered out during import
   - Events with duplicate start times (within 1 minute) are considered duplicates

4. **Scalability**:
   - Application is designed for moderate user loads
   - MongoDB Atlas is used for production deployments
   - No real-time features (polling is used for updates)

### Challenges Faced

1. **Database Migration**:
   - **Challenge**: Migrated from PostgreSQL with Prisma to MongoDB with Mongoose
   - **Solution**: Rewrote all models and queries to use Mongoose, updated type definitions, and ensured proper ObjectId handling

2. **Swap Logic Complexity**:
   - **Challenge**: Implementing atomic swap operations where both slots' times are exchanged
   - **Solution**: Used Mongoose transactions to ensure data consistency and prevent race conditions

3. **Calendar Import**:
   - **Challenge**: Parsing different calendar formats (ICS/iCal and CSV) with varying date formats
   - **Solution**: Used ical.js for ICS parsing, implemented custom CSV parser with robust error handling, added timezone buffer for past event filtering

4. **UI/UX Responsiveness**:
   - **Challenge**: Making the application work seamlessly on mobile devices with limited screen space
   - **Solution**: Implemented responsive design with media queries, hamburger menu for mobile navigation, and optimized spacing for smaller screens

5. **State Management**:
   - **Challenge**: Keeping frontend state synchronized with backend data (especially after swaps)
   - **Solution**: Implemented auto-refresh mechanisms using useEffect hooks, window focus listeners, and explicit refresh buttons

6. **Dark Mode Implementation**:
   - **Challenge**: Ensuring consistent styling across all pages in both light and dark modes
   - **Solution**: Created comprehensive dark mode styles for all components, used CSS custom properties where possible, and ensured proper contrast ratios

7. **Type Safety**:
   - **Challenge**: Maintaining type safety between frontend and backend with different data formats (ObjectId vs string)
   - **Solution**: Used TypeScript interfaces consistently, added proper type transformations in API responses, and used Zod for runtime validation

8. **File Upload Handling**:
   - **Challenge**: Handling large calendar files and parsing errors gracefully
   - **Solution**: Implemented file size limits (10MB), added try-catch blocks around individual event parsing, and provided clear error messages

## Docker Deployment

See [README.DOCKER.md](./README.DOCKER.md) for detailed Docker deployment instructions.

Quick start:
```bash
# Create .env file in root directory
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/slotswapper
JWT_SECRET=your-secret-key

# Build and run
docker-compose up -d --build
```

Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:3001

## Development

### Backend Commands

```bash
cd backend

# Development (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Frontend Commands

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing the API

### Using cURL

**Sign Up:**
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

**Get Events (with token):**
```bash
curl -X GET http://localhost:3001/api/events \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the API endpoints into Postman
2. Set up environment variables:
   - `base_url`: `http://localhost:3001/api`
   - `token`: (will be set after login)
3. Create requests for each endpoint
4. Use the "Tests" tab to automatically save the token after login

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using React, Node.js, Express, and MongoDB**
