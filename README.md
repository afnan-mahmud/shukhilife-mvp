# Shukhi Life

A lightweight MERN stack application with Express server and Vite React client, ready for JWT authentication and CORS.

## Project Structure

```
/ecommerce-lite
  /server                 # Express + Mongoose backend
    src/
      index.js           # Main server file
      config/
        env.js           # Environment configuration
        db.js            # MongoDB connection
      middleware/
        error.js         # Error handling middleware
    package.json
    env.example          # Environment variables template
  /web                   # Vite + React frontend
    src/
      main.jsx           # React entry point
      App.jsx            # Main App component
      index.css          # Global styles
    index.html
    package.json
    env.example          # Environment variables template
  package.json           # Root package.json with scripts
  README.md
```

## Features

- **Backend (Express + Mongoose)**
  - CORS enabled for `http://localhost:5173`
  - JSON body parsing
  - Morgan logging
  - MongoDB connection
  - Health check endpoint
  - Error handling middleware
  - JWT and bcryptjs ready
  - Steadfast API integration ready

- **Frontend (Vite + React)**
  - Modern Vite build tool
  - React 18
  - React Router DOM
  - Axios for API calls
  - js-cookie for cookie management
  - jsPDF for PDF generation
  - Environment variable support

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ecommerce-lite
   ```

2. **Install all dependencies:**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables:**
   
   **Server (.env in /server directory):**
   ```bash
   cp server/env.example server/.env
   ```
   
   Edit `server/.env` with your values:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ecommerce-lite
   JWT_SECRET=your-super-secret-jwt-key-here
   CLIENT_URL=http://localhost:5173
   STEADFAST_API_KEY=your-steadfast-api-key
   STEADFAST_SECRET_KEY=your-steadfast-secret-key
   STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
   ```

   **Web (.env in /web directory):**
   ```bash
   cp web/env.example web/.env
   ```
   
   Edit `web/.env` with your values:
   ```
   VITE_API_URL=http://localhost:5000
   VITE_META_PIXEL_ID=your-meta-pixel-id
   VITE_TIKTOK_PIXEL_ID=your-tiktok-pixel-id
   ```

### Running the Application

#### Option 1: Run both server and web together
```bash
npm run dev
```

#### Option 2: Run separately

**Start the server:**
```bash
npm run dev:server
# or
cd server && npm run dev
```

**Start the web app (in a new terminal):**
```bash
npm run dev:web
# or
cd web && npm run dev
```

### Verification

1. **Server should show:**
   ```
   Server listening on port 5000
   MongoDB connected successfully
   ```

2. **Test server health endpoint:**
   ```bash
   curl http://localhost:5000/health
   # Should return: {"ok":true}
   ```

3. **Web app should be available at:**
   ```
   http://localhost:5173
   # Should show "Web OK" message
   ```

## Available Scripts

### Root Level
- `npm run dev` - Run both server and web in development mode
- `npm run dev:server` - Run only the server
- `npm run dev:web` - Run only the web app
- `npm run start` - Run server in production mode
- `npm run install:all` - Install dependencies for all packages

### Server (/server)
- `npm run dev` - Run server with nodemon
- `npm start` - Run server in production mode

### Web (/web)
- `npm run dev` - Run Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Dependencies

### Server Dependencies
- **express** - Web framework
- **cors** - Cross-Origin Resource Sharing
- **mongoose** - MongoDB object modeling
- **dotenv** - Environment variable loading
- **morgan** - HTTP request logger
- **jsonwebtoken** - JWT implementation
- **bcryptjs** - Password hashing
- **axios** - HTTP client
- **dayjs** - Date manipulation
- **express-validator** - Input validation

### Web Dependencies
- **react** - UI library
- **react-dom** - React DOM rendering
- **react-router-dom** - Client-side routing
- **axios** - HTTP client
- **js-cookie** - Cookie management
- **jspdf** - PDF generation

## Development Notes

- The server is configured to accept requests from `http://localhost:5173`
- MongoDB connection is required for the server to start
- All environment variables have fallback defaults
- Error handling is implemented for common scenarios
- CORS is properly configured for development

## Next Steps

This setup provides a solid foundation for building an ecommerce application. You can now:

1. Add authentication routes and middleware
2. Create user and product models
3. Implement API endpoints
4. Build React components and pages
5. Add state management (Redux, Context API, etc.)
6. Implement payment processing
7. Add testing frameworks

## Troubleshooting

- **MongoDB connection issues**: Ensure MongoDB is running and the connection string is correct
- **Port conflicts**: Change PORT in server/.env if 5000 is occupied
- **CORS issues**: Verify CLIENT_URL matches your frontend URL
- **Module not found**: Run `npm run install:all` to install all dependencies

