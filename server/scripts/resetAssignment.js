require('dotenv').config();
const mongoose = require('mongoose');
const Setting = require('../models/Setting');
const config = require('../src/config/env');

const resetAssignment = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Reset the assignment counter
    await Setting.setValue(
      'lastAssignedSupportId', 
      null,
      'Reset assignment counter for testing'
    );

    console.log('✅ Assignment counter reset successfully');

  } catch (error) {
    console.error('❌ Error resetting assignment:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the reset function
resetAssignment();
