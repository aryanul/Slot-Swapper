# Backend Setup

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
DATABASE_URL="mongodb://localhost:27017/slotswapper"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
PORT=3001
```

### Configuration Details

- **DATABASE_URL**: MongoDB connection string. **IMPORTANT**: The database name must be included in the connection string!
  - For MongoDB Atlas: `mongodb+srv://user:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority`
    - Note the `/slotswapper` part - this is the database name. Make sure it's included after the cluster URL.
  - For local MongoDB: `mongodb://localhost:27017/slotswapper`
- **JWT_SECRET**: A secret key used to sign JWT tokens. Use a strong, random string in production.
- **PORT**: The port on which the backend server will run (default: 3001).

## Database Setup

1. Make sure MongoDB is running (local installation or MongoDB Atlas)
2. For local MongoDB, ensure it's running on the default port (27017)
3. For MongoDB Atlas, use the connection string provided in your cluster settings
4. The database schema will be automatically created when you start the server (Mongoose will create collections as needed)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The server will automatically connect to MongoDB when it starts.

## Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

