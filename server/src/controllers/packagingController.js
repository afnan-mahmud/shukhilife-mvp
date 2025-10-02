const Order = require('../../models/Order');
const { validationResult } = require('express-validator');

/**
 * Get confirmed orders for packaging (packaging user only)
 * GET /api/packaging/orders?from=YYYY-MM-DD&to=YYYY-MM-DD
 */
const getPackagingOrders = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Build filter object - only confirmed orders
    const filter = {
      status: 'confirmed'
    };

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

    // Get confirmed orders with only required fields
    const orders = await Order.find(filter)
      .select('invoice productSnapshot quantity amount phone customerName steadfast')
      .sort({ createdAt: -1 });

    // Format orders for packaging view
    const formattedOrders = orders.map(order => ({
      id: order._id,
      invoice: order.invoice,
      productSnapshot: order.productSnapshot,
      quantity: order.quantity,
      amount: order.amount,
      formattedAmount: order.formattedAmount,
      phone: order.phone,
      customerName: order.customerName,
      steadfast: {
        consignmentId: order.steadfast.consignmentId || null,
        sent: order.steadfast.sent || false,
        sentAt: order.steadfast.sentAt || null,
        lastError: order.steadfast.lastError || null
      },
      createdAt: order.createdAt
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      totalOrders: formattedOrders.length
    });
  } catch (error) {
    console.error('Get packaging orders error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching confirmed orders'
    });
  }
};

/**
 * Bulk complete orders (packaging user only)
 * POST /api/packaging/complete-today
 */
const completeOrdersToday = async (req, res) => {
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

    const { orderIds } = req.body;

    // Validate that all provided order IDs are valid MongoDB ObjectIds
    const mongoose = require('mongoose');
    const validOrderIds = orderIds.filter(id => mongoose.Types.ObjectId.isValid(id));
    
    if (validOrderIds.length !== orderIds.length) {
      return res.status(400).json({
        success: false,
        error: 'One or more order IDs are invalid'
      });
    }

    // Find all confirmed orders with the provided IDs
    const orders = await Order.find({
      _id: { $in: validOrderIds },
      status: 'confirmed'
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No confirmed orders found with the provided IDs'
      });
    }

    // Update all found orders to completed status
    const updateResult = await Order.updateMany(
      { _id: { $in: orders.map(order => order._id) } },
      { 
        status: 'completed',
        updatedAt: new Date()
      }
    );

    // Get the updated orders for response
    const updatedOrders = await Order.find({
      _id: { $in: orders.map(order => order._id) }
    }).select('invoice customerName status updatedAt');

    res.json({
      success: true,
      message: `Successfully completed ${updateResult.modifiedCount} orders`,
      completedCount: updateResult.modifiedCount,
      orders: updatedOrders.map(order => ({
        id: order._id,
        invoice: order.invoice,
        customerName: order.customerName,
        status: order.status,
        completedAt: order.updatedAt
      }))
    });
  } catch (error) {
    console.error('Complete orders today error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while completing orders'
    });
  }
};

module.exports = {
  getPackagingOrders,
  completeOrdersToday
};
