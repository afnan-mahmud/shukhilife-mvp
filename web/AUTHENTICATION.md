# Authentication & Routing System

## Overview
This React application implements a role-based authentication system with protected routes for different user types.

## Features

### 🔐 Authentication
- **AuthContext**: Manages user state and authentication
- **Token Storage**: JWT tokens stored in localStorage
- **Auto-logout**: Automatic logout on token expiration
- **Role-based Access**: Different access levels for admin, support, and packaging users

### 🛡️ Protected Routes
- **ProtectedRoute HOC**: Wraps components requiring authentication
- **Role Validation**: Ensures users can only access their assigned areas
- **Automatic Redirects**: Redirects to appropriate dashboard based on user role

### 🎯 User Roles & Access

#### Admin (`/admin/*`)
- Dashboard overview
- Orders management
- Products management
- Users management
- Reports & analytics

#### Support (`/support/*`)
- My assigned orders
- Create new orders
- Personal performance report

#### Packaging (`/packaging/*`)
- Confirmed orders ready for packaging

### 🚀 API Integration
- **Axios Client**: Configured with base URL and auth headers
- **Request Interceptors**: Automatically adds JWT token to requests
- **Response Interceptors**: Handles 401 errors and auto-logout

## Usage

### Login Credentials
- **Admin**: `admin@ecommerce-lite.com` / `AdminPass123`
- **Support**: `support2@ecommerce-lite.com` / `SupportPass123`
- **Packaging**: `packaging@ecommerce-lite.com` / `PackagingPass123`

### Navigation
1. Visit `http://localhost:5173`
2. Login with appropriate credentials
3. Automatically redirected to role-specific dashboard
4. Use sidebar navigation to access different sections

### Environment Variables
```env
VITE_API_URL=http://localhost:3000
```

## File Structure
```
src/
├── contexts/
│   └── AuthContext.jsx          # Authentication context
├── components/
│   └── ProtectedRoute.jsx       # Route protection HOC
├── layouts/
│   ├── AdminLayout.jsx          # Admin panel layout
│   ├── SupportLayout.jsx        # Support panel layout
│   └── PackagingLayout.jsx      # Packaging panel layout
├── pages/
│   ├── Login.jsx                # Login page
│   ├── admin/                   # Admin pages
│   ├── support/                 # Support pages
│   └── packaging/               # Packaging pages
└── utils/
    └── api.js                   # Axios configuration
```

## Security Features
- JWT token validation
- Role-based access control
- Automatic token refresh handling
- Secure logout functionality
- Protected API endpoints
