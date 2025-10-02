const Order = require('../../models/Order');
const User = require('../../models/User');
const mongoose = require('mongoose');
const { isValidObjectId } = mongoose;
const { validationResult } = require('express-validator');
const { sendToSteadfast } = require('../../services/steadfast');
const { serializeOrder } = require('../utils/serializers');
const steadfastService = require('../services/steadfastService');
const { toSteadfastPayload } = require('../utils/steadfastMapper');

/**
 * Get all orders with filtering and pagination (admin-only)
 * GET /api/orders?q=search&status=pending&from=2023-01-01&to=2023-12-31&assignedTo=userId&page=1&limit=10
 */
const getOrders = async (req, res) => {
  try {
    const {
      q, // search in name/phone/invoice
      status,
      from,
      to,
      assignedTo,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter object
    const filter = {};

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

    // Assigned to filter (accept ObjectId or label "Name (email)")
    if (assignedTo) {
      if (isValidObjectId(assignedTo)) {
        filter.assignedTo = assignedTo;
      } else {
        // Try to resolve by email inside "Name (email)" or direct email
        const emailMatch = assignedTo.match(/\(([^)]+)\)$/)?.[1] || assignedTo;
        const user = await User.findOne({ $or: [{ email: emailMatch }, { name: assignedTo }] }, { _id: 1 });
        if (user) {
          filter.assignedTo = user._id;
        } else {
          // Ignore invalid value instead of crashing
          // You can also return 400 if you prefer strict behavior:
          // return res.status(400).json({ message: 'Invalid assignedTo value' });
        }
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
    console.error('Get orders error:', error);
    res.json({
      ok: true,
      page: 1,
      total: 0,
      data: []
    });
  }
};

/**
 * Get order by ID (admin-only)
 * GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('assignedTo', 'name email')
      .populate('product', 'name slug price image')
      .populate('notes.author', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
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
    console.error('Get order by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching order'
    });
  }
};

/**
 * Update order (admin-only)
 * PATCH /api/orders/:id
 */
const updateOrder = async (req, res) => {
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
    const { status, amount, assignedTo, address, phone, altPhone, email } = req.body;

    // Find order by ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Validate assignedTo if provided
    if (assignedTo) {
      const user = await User.findById(assignedTo);
      if (!user || user.role !== 'support') {
        return res.status(400).json({
          success: false,
          error: 'Invalid support user ID'
        });
      }
    }

    // Update order fields
    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (address !== undefined) updateData.address = address.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (altPhone !== undefined) updateData.altPhone = altPhone.trim();
    if (email !== undefined) updateData.email = email ? email.toLowerCase().trim() : '';

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
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating order'
    });
  }
};

/**
 * Delete order (admin-only)
 * DELETE /api/orders/:id
 */
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting order'
    });
  }
};

/**
 * Add note to order (admin & support)
 * POST /api/orders/:id/notes
 */
const addNote = async (req, res) => {
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

    // Find order by ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Add note to order
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
    console.error('Add note error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error while adding note',
      details: error.message
    });
  }
};

/**
 * Send order to Steadfast courier service (admin & support)
 * POST /api/orders/:id/steadfast/send
 */
const sendToSteadfastCourier = async (req, res) => {
  try {
    const { id } = req.params;

    // Find order by ID
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    // Check if already sent to Steadfast
    if (order.steadfast.sent) {
      return res.status(409).json({
        success: false,
        error: 'Order has already been sent to Steadfast',
        consignmentId: order.steadfast.consignmentId,
        sentAt: order.steadfast.sentAt
      });
    }

    // Send to Steadfast service
    const steadfastResult = await sendToSteadfast(order);

    if (steadfastResult.success) {
      // Update order with Steadfast details
      order.steadfast.sent = true;
      order.steadfast.consignmentId = steadfastResult.consignmentId;
      order.steadfast.sentAt = new Date();
      order.steadfast.lastError = null; // Clear any previous errors

      await order.save();

      res.json({
        success: true,
        message: 'Order successfully sent to Steadfast',
        consignmentId: steadfastResult.consignmentId,
        sentAt: order.steadfast.sentAt,
        order: {
          id: order._id,
          invoice: order.invoice,
          status: order.status,
          steadfast: order.steadfast
        }
      });
    } else {
      // Store API error
      order.steadfast.lastError = steadfastResult.error;
      await order.save();

      res.status(400).json({
        success: false,
        error: 'Failed to send order to Steadfast',
        details: steadfastResult.error,
        statusCode: steadfastResult.statusCode
      });
    }
  } catch (error) {
    console.error('Send to Steadfast error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while sending to Steadfast'
    });
  }
};

/**
 * Send order to Steadfast courier service
 * POST /api/orders/:id/steadfast/send
 */
const sendOrderToSteadfast = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        ok: false,
        message: 'Order not found'
      });
    }

    // Check if already sent
    if (order.steadfast.sent && order.steadfast.consignmentId) {
      return res.status(409).json({
        ok: false,
        message: 'Order already sent to Steadfast',
        data: {
          consignmentId: order.steadfast.consignmentId,
          trackingCode: order.steadfast.trackingCode,
          status: order.steadfast.status
        }
      });
    }

    // Build Steadfast payload
    let payload;
    try {
      payload = toSteadfastPayload(order);
    } catch (error) {
      return res.status(422).json({
        ok: false,
        message: error.message
      });
    }

    // Send to Steadfast
    const result = await steadfastService.createOrder(payload);

    if (!result.ok) {
      // Update order with error
      order.steadfast.lastError = result.message;
      await order.save();

      return res.status(400).json({
        ok: false,
        message: 'Steadfast rejected order',
        vendor: result.vendor
      });
    }

    // Update order with Steadfast data
    order.steadfast.sent = true;
    order.steadfast.consignmentId = result.data.consignmentId;
    order.steadfast.trackingCode = result.data.trackingCode;
    order.steadfast.status = result.data.status;
    order.steadfast.sentAt = new Date();
    order.steadfast.lastSyncedAt = new Date();
    order.steadfast.lastError = '';

    await order.save();

    res.json({
      ok: true,
      message: 'Order sent to Steadfast successfully',
      data: {
        consignmentId: result.data.consignmentId,
        trackingCode: result.data.trackingCode,
        status: result.data.status
      }
    });

  } catch (error) {
    console.error('Send to Steadfast error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while sending to Steadfast'
    });
  }
};

/**
 * Get Steadfast status for an order
 * GET /api/orders/:id/steadfast/status
 */
const getSteadfastStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid order ID format'
      });
    }

    // Find the order
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        ok: false,
        message: 'Order not found'
      });
    }

    let result;

    // Try different methods to get status
    if (order.steadfast.consignmentId) {
      result = await steadfastService.statusByConsignmentId(order.steadfast.consignmentId);
    } else if (order.invoice) {
      result = await steadfastService.statusByInvoice(order.invoice);
    } else if (order.steadfast.trackingCode) {
      result = await steadfastService.statusByTracking(order.steadfast.trackingCode);
    } else {
      return res.status(400).json({
        ok: false,
        message: 'No Steadfast tracking information available for this order'
      });
    }

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        message: result.message,
        vendor: result.vendor
      });
    }

    // Update order status if we got new data
    if (result.data && result.data.status) {
      order.steadfast.status = result.data.status;
      order.steadfast.lastSyncedAt = new Date();
      await order.save();
    }

    res.json({
      ok: true,
      data: {
        status: order.steadfast.status,
        consignmentId: order.steadfast.consignmentId,
        trackingCode: order.steadfast.trackingCode,
        lastSyncedAt: order.steadfast.lastSyncedAt
      }
    });

  } catch (error) {
    console.error('Get Steadfast status error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while getting Steadfast status'
    });
  }
};

/**
 * Get Steadfast account balance
 * GET /api/steadfast/balance
 */
const getSteadfastBalance = async (req, res) => {
  try {
    const result = await steadfastService.getBalance();

    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        message: result.message,
        vendor: result.vendor
      });
    }

    res.json({
      ok: true,
      data: result.data
    });

  } catch (error) {
    console.error('Get Steadfast balance error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while getting Steadfast balance'
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  addNote,
  sendToSteadfastCourier,
  sendOrderToSteadfast,
  getSteadfastStatus,
  getSteadfastBalance
};
