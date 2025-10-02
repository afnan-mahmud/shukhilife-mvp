const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .optional()
    .isIn(['admin', 'support', 'packaging'])
    .withMessage('Role must be one of: admin, support, packaging')
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for admin user creation
 */
const validateCreateUser = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['admin', 'support', 'packaging'])
    .withMessage('Role must be one of: admin, support, packaging')
];

/**
 * Validation rules for updating user role
 */
const validateUpdateRole = [
  body('role')
    .isIn(['admin', 'support', 'packaging'])
    .withMessage('Role must be one of: admin, support, packaging')
];

/**
 * Validation rules for creating/updating products
 */
const validateProduct = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('price')
    .exists()
    .withMessage('Price is required'),
  
  body('imageUrl')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Image URL is required'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  
  body('slug')
    .optional()
    .isString()
];

/**
 * Validation rules for updating products (all fields optional)
 */
const validateUpdateProduct = [
  body('name')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  
  body('price')
    .optional()
    .exists()
    .withMessage('Price is required when provided'),
  
  body('imageUrl')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Image URL cannot be empty'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be boolean'),
  
  body('slug')
    .optional()
    .isString()
    .trim()
];

/**
 * Validation rules for checkout/order creation
 */
const validateCheckout = [
  body('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),
  
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[0-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('deliveryLocation')
    .isIn(['inside', 'outside'])
    .withMessage('Delivery location must be either "inside" or "outside"'),
  
  body('shippingCost')
    .isNumeric()
    .withMessage('Shipping cost must be a number'),
  
  body('totalPrice')
    .isNumeric()
    .withMessage('Total price must be a number')
];

/**
 * Validation rules for updating orders
 */
const validateUpdateOrder = [
  body('status')
    .optional()
    .isIn(['pending', 'on_hold', 'call_not_received', 'confirmed', 'canceled', 'completed'])
    .withMessage('Status must be one of: pending, on_hold, call_not_received, confirmed, canceled, completed'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),
  
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Assigned to must be a valid MongoDB ObjectId'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('altPhone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid alternate phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase()
];

/**
 * Validation rules for adding notes
 */
const validateAddNote = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Note text is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters')
];

/**
 * Validation rules for support order updates (limited fields)
 */
const validateSupportUpdateOrder = [
  body('status')
    .optional()
    .isIn(['pending', 'on_hold', 'call_not_received', 'confirmed', 'canceled', 'completed'])
    .withMessage('Status must be one of: pending, on_hold, call_not_received, confirmed, canceled, completed'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
];

/**
 * Validation rules for support order creation
 */
const validateSupportCreateOrder = [
  body('productId')
    .isMongoId()
    .withMessage('Product ID must be a valid MongoDB ObjectId'),
  
  body('quantity')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Quantity must be between 1 and 1000'),
  
  body('customerName')
    .trim()
    .notEmpty()
    .withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid phone number'),
  
  body('altPhone')
    .optional()
    .trim()
    .matches(/^[\+]?[1-9][\d]{0,15}$/)
    .withMessage('Please enter a valid alternate phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .toLowerCase(),
  
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Address must be between 10 and 500 characters'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number')
];

/**
 * Validation rules for bulk completing orders
 */
const validateCompleteOrders = [
  body('orderIds')
    .isArray({ min: 1 })
    .withMessage('orderIds must be a non-empty array'),
  
  body('orderIds.*')
    .isMongoId()
    .withMessage('Each order ID must be a valid MongoDB ObjectId')
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateUser,
  validateUpdateRole,
  validateProduct,
  validateUpdateProduct,
  validateCheckout,
  validateUpdateOrder,
  validateAddNote,
  validateSupportUpdateOrder,
  validateSupportCreateOrder,
  validateCompleteOrders
};
