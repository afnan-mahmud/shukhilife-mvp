const Order = require('../../models/Order');
const Product = require('../../models/Product');
const { assignNextSupport } = require('../../utils/assignment');
const { validationResult } = require('express-validator');

/**
 * Create a new order from checkout (public endpoint)
 * POST /api/checkout
 */
const createOrder = async (req, res) => {
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

    const { productId, quantity, customerName, phone, address, deliveryLocation, shippingCost, totalPrice } = req.body;

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

    // Validate delivery location and calculate shipping cost
    const validDeliveryLocations = ['inside', 'outside'];
    if (!validDeliveryLocations.includes(deliveryLocation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid delivery location'
      });
    }

    // Calculate shipping cost server-side for security
    const serverShippingCost = deliveryLocation === 'inside' ? 80 : 130;
    
    // Calculate amounts
    const productAmount = product.price * quantity;
    const serverTotalPrice = productAmount + serverShippingCost;

    // Validate total price matches server calculation (don't trust client)
    if (Math.abs(totalPrice - serverTotalPrice) > 0.01) {
      return res.status(400).json({
        success: false,
        error: 'Invalid total price calculation'
      });
    }

    // Assign to next support user
    const assignedUser = await assignNextSupport();

    // Generate invoice number
    const invoice = Order.generateInvoice();

    // Create product snapshot
    const productSnapshot = {
      name: product.name,
      price: product.price,
      image: product.imageUrl || ''
    };

    // Create new order
    const order = new Order({
      invoice,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      product: productId,
      productSnapshot,
      quantity,
      amount: serverTotalPrice, // Use server-calculated total
      assignedTo: assignedUser._id,
      // Store delivery information in notes for tracking
      notes: [{
        author: assignedUser._id,
        text: `Delivery Location: ${deliveryLocation === 'inside' ? 'Inside Dhaka' : 'Outside Dhaka'} (${serverShippingCost}৳ shipping)`,
        createdAt: new Date()
      }]
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
      deliveryLocation: deliveryLocation,
      shippingCost: serverShippingCost,
      totalPrice: serverTotalPrice,
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
    console.error('Create order error:', error);
    
    // Handle specific error cases
    if (error.message === 'No support users found') {
      return res.status(500).json({
        success: false,
        error: 'No support staff available. Please try again later.'
      });
    }

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
 * Get order by invoice (public endpoint for order tracking)
 * GET /api/checkout/:invoice
 */
const getOrderByInvoice = async (req, res) => {
  try {
    const { invoice } = req.params;

    const order = await Order.findOne({ invoice: invoice.toUpperCase() })
      .populate('assignedTo', 'name email')
      .populate('product', 'name slug price image');

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
          name: order.assignedTo.name,
          email: order.assignedTo.email
        },
        notes: order.notes,
        steadfast: order.steadfast,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }
    });
  } catch (error) {
    console.error('Get order by invoice error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching order'
    });
  }
};

module.exports = {
  createOrder,
  getOrderByInvoice
};
