require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const config = require('../src/config/env');

const testOrder = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find an order
    const order = await Order.findById('68dbc425b3705d2f5bf5743c');
    console.log('Order found:', order ? order.invoice : 'Not found');

    if (order) {
      // Try to add a note
      order.notes.push({
        author: '68d83456f27d19533423aef1',
        text: 'Test note from script'
      });
      
      await order.save();
      console.log('✅ Note added successfully');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the test
testOrder();
