const mongoose = require('mongoose');
const User = require('../../models/User');
const { validationResult } = require('express-validator');

/**
 * Create a new user (admin-only)
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const fieldErrors = {};
      errors.array().forEach(error => {
        fieldErrors[error.path] = error.msg;
      });
      
      return res.status(422).json({
        ok: false,
        message: 'Validation failed',
        fields: fieldErrors
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        ok: false,
        message: 'Email already exists'
      });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      role: role || 'packaging'
    });
    
    // Set password using virtual field
    user.password = password;

    await user.save();

    res.status(201).json({
      ok: true,
      message: 'User created successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const fieldErrors = {};
      Object.keys(error.errors).forEach(field => {
        fieldErrors[field] = error.errors[field].message;
      });
      
      return res.status(422).json({
        ok: false,
        message: 'Validation failed',
        fields: fieldErrors
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        ok: false,
        message: 'Email already exists'
      });
    }
    
    res.status(500).json({
      ok: false,
      message: 'Internal server error while creating user'
    });
  }
};

/**
 * Get all users (admin-only)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('_id name email role createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching users'
    });
  }
};

/**
 * Update user (admin-only)
 * PATCH /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, email, role, password } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User with this email already exists'
        });
      }
      user.email = email.toLowerCase().trim();
    }

    // Update fields
    if (name) user.name = name.trim();
    if (role) user.role = role;
    if (password) user.password = password; // Virtual field will hash it

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating user'
    });
  }
};

/**
 * Update user role (admin-only)
 * PATCH /api/admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Find user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update role
    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating user role'
    });
  }
};

/**
 * Get user by ID (admin-only)
 * GET /api/admin/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('_id name email role createdAt');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching user'
    });
  }
};

/**
 * Delete user (admin-only)
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the path param
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid or missing user id.'
      });
    }

    // Block self-delete
    if (req.user && req.user._id.toString() === id) {
      return res.status(400).json({
        ok: false,
        message: 'You cannot delete your own account.'
      });
    }

    // Load the target user to check role
    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({
        ok: false,
        message: 'User not found.'
      });
    }

    // Block deleting Admins (optional policy)
    if (targetUser.role === 'admin') {
      return res.status(403).json({
        ok: false,
        message: 'Deleting Admin users is not allowed.'
      });
    }

    // Perform the deletion
    await User.findByIdAndDelete(id);

    res.json({
      ok: true,
      message: 'User deleted successfully.',
      id: id
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while deleting user.'
    });
  }
};

module.exports = {
  createUser,
  getUsers,
  updateUser,
  updateUserRole,
  getUserById,
  deleteUser
};
