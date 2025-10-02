require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const { requireAuth, requireRole } = require('./middleware/auth');
const { validateRegister, validateLogin, validateCreateUser, validateUpdateRole, validateProduct, validateUpdateProduct, validateCheckout, validateUpdateOrder, validateAddNote, validateSupportUpdateOrder, validateSupportCreateOrder, validateCompleteOrders } = require('./middleware/validation');
const authController = require('./controllers/authController');
const adminController = require('./controllers/adminController');
const productController = require('./controllers/productController');
const checkoutController = require('./controllers/checkoutController');
const orderController = require('./controllers/orderController');
const supportController = require('./controllers/supportController');
const packagingController = require('./controllers/packagingController');
const dashboardController = require('./controllers/dashboardController');
const reportsController = require('./controllers/reportsController');
const landingRoutes = require('./routes/landingRoutes');


// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Auth routes
app.post('/api/auth/register', requireAuth, requireRole('admin'), validateRegister, authController.register);
app.post('/api/auth/login', validateLogin, authController.login);
app.get('/api/auth/me', requireAuth, authController.getMe);
app.post('/api/auth/logout', requireAuth, authController.logout);

// Admin routes
app.post('/api/admin/users', requireAuth, requireRole('admin'), validateCreateUser, adminController.createUser);
app.get('/api/admin/users', requireAuth, requireRole('admin'), adminController.getUsers);
app.get('/api/admin/users/:id', requireAuth, requireRole('admin'), adminController.getUserById);
app.patch('/api/admin/users/:id', requireAuth, requireRole('admin'), validateCreateUser, adminController.updateUser);
app.patch('/api/admin/users/:id/role', requireAuth, requireRole('admin'), validateUpdateRole, adminController.updateUserRole);
app.delete('/api/admin/users/:id', requireAuth, requireRole('admin'), adminController.deleteUser);

// Product routes (admin only)
app.post('/api/products', requireAuth, requireRole('admin'), validateProduct, productController.createProduct);
app.get('/api/products', productController.getProducts);
app.get('/api/products/slug/:slug', productController.getProductBySlug);

// Product basic list for admin dropdowns (must come before /:id route)
app.get('/api/products/basic', requireAuth, requireRole('admin'), async (req, res) => {
  const Product = require('../models/Product');
  const filter = {};
  if (String(req.query.active || '') === '1') filter.isActive = true;

  const rows = await Product.find(filter, { name: 1, slug: 1, isActive: 1 })
    .sort({ name: 1 })
    .lean();

  res.json(rows || []);
});

app.get('/api/products/:id', productController.getProductById);
app.patch('/api/products/:id', requireAuth, requireRole('admin'), validateUpdateProduct, productController.updateProduct);
app.delete('/api/products/:id', requireAuth, requireRole('admin'), productController.deleteProduct);

// Checkout routes (public)
app.post('/api/checkout', validateCheckout, checkoutController.createOrder);
app.get('/api/checkout/:invoice', checkoutController.getOrderByInvoice);

// Order management routes (admin & support)
app.get('/api/orders', requireAuth, requireRole('admin', 'support'), orderController.getOrders);
app.get('/api/orders/:id', requireAuth, requireRole('admin', 'support'), orderController.getOrderById);
app.patch('/api/orders/:id', requireAuth, requireRole('admin'), validateUpdateOrder, orderController.updateOrder);
app.delete('/api/orders/:id', requireAuth, requireRole('admin'), orderController.deleteOrder);
app.post('/api/orders/:id/notes', requireAuth, requireRole('admin', 'support'), validateAddNote, orderController.addNote);
app.post('/api/orders/:id/steadfast/send', requireAuth, requireRole('admin', 'support'), orderController.sendOrderToSteadfast);
app.get('/api/orders/:id/steadfast/status', requireAuth, requireRole('admin', 'support'), orderController.getSteadfastStatus);
app.get('/api/steadfast/balance', requireAuth, requireRole('admin'), orderController.getSteadfastBalance);

// Support order management routes (support only)
app.get('/api/support/orders', requireAuth, requireRole('support'), supportController.getSupportOrders);
app.get('/api/support/orders/:id', requireAuth, requireRole('support'), supportController.getSupportOrderById);
app.patch('/api/support/orders/:id', requireAuth, requireRole('support'), validateSupportUpdateOrder, supportController.updateSupportOrder);
app.post('/api/support/orders', requireAuth, requireRole('support'), validateSupportCreateOrder, supportController.createSupportOrder);
app.post('/api/support/orders/:id/notes', requireAuth, requireRole('support'), validateAddNote, supportController.addSupportNote);

// Packaging order management routes (packaging only)
app.get('/api/packaging/orders', requireAuth, requireRole('packaging'), packagingController.getPackagingOrders);
app.post('/api/packaging/complete-today', requireAuth, requireRole('packaging'), validateCompleteOrders, packagingController.completeOrdersToday);

// Dashboard and reports routes
app.get('/api/dashboard/summary', requireAuth, requireRole('admin'), dashboardController.getDashboardSummary);
app.get('/api/reports/support', requireAuth, requireRole('admin'), reportsController.getSupportReport);
app.get('/api/support/me/report', requireAuth, requireRole('support'), reportsController.getMySupportReport);

// Landing pages routes
app.use('/api/landing', landingRoutes);


// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please change PORT in server/.env`);
    process.exit(1);
  } else {
    throw err;
  }
});

