import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PixelManager from './pixels/PixelManager';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import SupportLayout from './layouts/SupportLayout';
import PackagingLayout from './layouts/PackagingLayout';

// Pages
import Login from './pages/Login';
import Home from './pages/Home';
import ProductLanding from './pages/ProductLanding';
import ThankYou from './pages/ThankYou';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminProducts from './pages/admin/Products';
import AdminUsers from './pages/admin/Users';
import AdminReports from './pages/admin/Reports';
import AdminLandingPages from './pages/admin/LandingPages';

// Support Pages
import SupportOrders from './pages/support/Orders';
import SupportCreateOrder from './pages/support/CreateOrder';
import SupportMyReport from './pages/support/MyReport';

// Packaging Pages
import PackagingOrders from './pages/packaging/Orders';

function App() {
  return (
    <AuthProvider>
      <Router>
        <PixelManager>
          <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/p/:slug" element={<ProductLanding />} />
          <Route path="/thank-you" element={<ThankYou />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRoles="admin">
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="landing" element={<AdminLandingPages />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>

          {/* Support routes */}
          <Route path="/support" element={
            <ProtectedRoute requiredRoles="support">
              <SupportLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/support/orders" replace />} />
            <Route path="orders" element={<SupportOrders />} />
            <Route path="create-order" element={<SupportCreateOrder />} />
            <Route path="my-report" element={<SupportMyReport />} />
          </Route>

          {/* Packaging routes */}
          <Route path="/packaging" element={
            <ProtectedRoute requiredRoles="packaging">
              <PackagingLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/packaging/orders" replace />} />
            <Route path="orders" element={<PackagingOrders />} />
          </Route>

          {/* Default redirect */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </PixelManager>
      </Router>
    </AuthProvider>
  );
}

export default App;

