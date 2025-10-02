const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const { serializeOrder } = require('../utils/serializers');

/**
 * Get support user's assigned orders with filtering and pagination
 * GET /api/support/orders?q=search&status=pending&from=2023-01-01&to=2023-12-31&page=1&limit=10
 */
const getSupportOrders = async (req, res) => {
  try {
    // Safety check for req.user
    if (!req.user || !req.user._id) {
      return res.json({
        ok: true,
        page: 1,
        total: 0,
        data: []
      });
    }

    const {
      q, // search in name/phone/invoice
      status,
      from,
      to,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object - only orders assigned to current support user
    const filter = {
      assignedTo: req.user._id
    };

    // Search query
    if (q) {
      filter.$or = [
        { customerName: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { invoice: { $regex: q, $options: 'i' } }
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (from || to) {
      filter.createdAt = {};
      if (from) {
        filter.createdAt.$gte = new Date(from);
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of day
        filter.createdAt.$lte = toDate;
      }
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Order.countDocuments(filter);

    // Get orders with populated fields
    const orders = await Order.find(filter)
      .populate('assignedTo', 'name email')
      .populate('product', 'name slug price image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Format orders with safe null handling
    const formattedOrders = orders.map(serializeOrder);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      ok: true,
      page: pageNum,
      total,
      data: formattedOrders
    });
  } catch (error) {
    console.error('Get support orders error:', error);
    res.json({
      ok: true,
      page: 1,
      total: 0,
      data: []
    });
  }
};

/**
 * Get support user's order by ID
 * GET /api/support/orders/:id
 */
const getSupportOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      assignedTo: req.user._id
    })
      .populate('assignedTo', 'name email')
      .populate('product', 'name slug price image')
      .populate('notes.author', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not assigned to you'
      });
    }

    res.json({
      success: true,
      order: {
        id: order._id,
        invoice: order.invoice,
        customerName: order.customerName,
        phone: order.phone,
        altPhone: order.altPhone,
        email: order.email,
        address: order.address,
        product: {
          id: order.product._id,
          name: order.product.name,
          slug: order.product.slug,
          price: order.product.price,
          image: order.product.image
        },
        productSnapshot: order.productSnapshot,
        quantity: order.quantity,
        amount: order.amount,
        formattedAmount: order.formattedAmount,
        status: order.status,
        assignedTo: {
          id: order.assignedTo._id,
          name: order.assignedTo.name,
          email: order.assignedTo.email
        },
        notes: order.notes.map(note => ({
          id: note._id,
          text: note.text,
          author: {
            id: note.author._id,
            name: note.author.name,
            email: note.author.email
          },
          createdAt: note.createdAt
        })),
        steadfast: order.steadfast,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Get support order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching order'
    });
  }
};

/**
 * Update support user's order (limited fields)
 * PATCH /api/support/orders/:id
 */
const updateSupportOrder = async (req, res) => {
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
    const { status, amount } = req.body;

    // Find order assigned to current support user
    const order = await Order.findOne({
      _id: id,
      assignedTo: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not assigned to you'
      });
    }

    // Update order fields (only status and amount allowed)
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);

    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        id: updatedOrder._id,
        invoice: updatedOrder.invoice,
        customerName: updatedOrder.customerName,
        phone: updatedOrder.phone,
        altPhone: updatedOrder.altPhone,
        email: updatedOrder.email,
        address: updatedOrder.address,
        quantity: updatedOrder.quantity,
        amount: updatedOrder.amount,
        formattedAmount: updatedOrder.formattedAmount,
        status: updatedOrder.status,
        assignedTo: {
          id: updatedOrder.assignedTo._id,
          name: updatedOrder.assignedTo.name,
          email: updatedOrder.assignedTo.email
        },
        updatedAt: updatedOrder.updatedAt
      }
    });
  } catch (error) {
    console.error('Update support order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating order'
    });
  }
};

/**
 * Create new order (auto-assigned to support user as confirmed)
 * POST /api/support/orders
 */
const createSupportOrder = async (req, res) => {
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

    const { productId, quantity, customerName, phone, altPhone, email, address, amount } = req.body;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if product is active
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Product is not available for purchase'
      });
    }

    // Calculate amount (use provided amount or calculate from product price)
    const orderAmount = amount !== undefined ? parseFloat(amount) : (product.price * quantity);

    // Generate invoice number
    const invoice = Order.generateInvoice();

    // Create product snapshot
    const productSnapshot = {
      name: product.name,
      price: product.price,
      image: product.image || ''
    };

    // Create new order (auto-assigned to current support user as confirmed)
    const order = new Order({
      invoice,
      customerName: customerName.trim(),
      phone: phone.trim(),
      altPhone: altPhone ? altPhone.trim() : '',
      email: email ? email.toLowerCase().trim() : '',
      address: address.trim(),
      product: productId,
      productSnapshot,
      quantity,
      amount: orderAmount,
      assignedTo: req.user._id,
      status: 'confirmed' // Auto-confirmed when created by support
    });

    await order.save();

    // Populate assigned user details
    await order.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      invoice: order.invoice,
      status: order.status,
      assignedTo: {
        name: order.assignedTo.name,
        email: order.assignedTo.email
      },
      amount: order.amount,
      formattedAmount: order.formattedAmount,
      order: {
        id: order._id,
        invoice: order.invoice,
        customerName: order.customerName,
        phone: order.phone,
        email: order.email,
        product: {
          name: order.productSnapshot.name,
          price: order.productSnapshot.price,
          image: order.productSnapshot.image
        },
        quantity: order.quantity,
        amount: order.amount,
        status: order.status,
        assignedTo: {
          name: order.assignedTo.name,
          email: order.assignedTo.email
        },
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    console.error('Create support order error:', error);
    
    // Handle specific error cases
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Invoice number conflict. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error during order creation'
    });
  }
};

/**
 * Add note to support user's order
 * POST /api/support/orders/:id/notes
 */
const addSupportNote = async (req, res) => {
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
    const { text } = req.body;
    const authorId = req.user._id;

    // Find order assigned to current support user
    const order = await Order.findOne({
      _id: id,
      assignedTo: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or not assigned to you'
      });
    }

    // Add note to order
    const mongoose = require('mongoose');
    order.notes.push({
      author: new mongoose.Types.ObjectId(authorId),
      text: text.trim()
    });
    await order.save();

    // Get updated order with populated notes
    const updatedOrder = await Order.findById(id)
      .populate('notes.author', 'name email')
      .populate('assignedTo', 'name email');

    res.json({
      success: true,
      message: 'Note added successfully',
      note: {
        id: updatedOrder.notes[updatedOrder.notes.length - 1]._id,
        text: text.trim(),
        author: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email
        },
        createdAt: updatedOrder.notes[updatedOrder.notes.length - 1].createdAt
      },
      order: {
        id: updatedOrder._id,
        invoice: updatedOrder.invoice,
        status: updatedOrder.status,
        assignedTo: {
          id: updatedOrder.assignedTo._id,
          name: updatedOrder.assignedTo.name,
          email: updatedOrder.assignedTo.email
        }
      }
    });
  } catch (error) {
    console.error('Add support note error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding note',
      details: error.message
    });
  }
};

module.exports = {
  getSupportOrders,
  getSupportOrderById,
  updateSupportOrder,
  createSupportOrder,
  addSupportNote
};
