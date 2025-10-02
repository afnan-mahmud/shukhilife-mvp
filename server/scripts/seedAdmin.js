require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const config = require('../src/config/env');

const seedAdmin = async () => {
  try {
    // Connect to database
    await mongoose.connect(config.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Get admin credentials from environment variables
    const adminName = process.env.SEED_ADMIN_NAME;
    const adminEmail = process.env.SEED_ADMIN_EMAIL;
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    // Validate required environment variables
    if (!adminName || !adminEmail || !adminPassword) {
      console.error('❌ Missing required environment variables:');
      if (!adminName) console.error('  - SEED_ADMIN_NAME');
      if (!adminEmail) console.error('  - SEED_ADMIN_EMAIL');
      if (!adminPassword) console.error('  - SEED_ADMIN_PASSWORD');
      console.error('\nPlease add these variables to your .env file');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(adminEmail)) {
      console.error('❌ Invalid email format for SEED_ADMIN_EMAIL');
      process.exit(1);
    }

    // Validate password strength
    if (adminPassword.length < 6) {
      console.error('❌ SEED_ADMIN_PASSWORD must be at least 6 characters long');
      process.exit(1);
    }

    // Create admin user
    const admin = new User({
      name: adminName.trim(),
      email: adminEmail.toLowerCase().trim(),
      role: 'admin'
    });
    
    // Set password using virtual field
    admin.password = adminPassword;

    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Name:', admin.name);
    console.log('🔑 Role:', admin.role);
    console.log('\n🚀 You can now login with these credentials');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    
    if (error.code === 11000) {
      console.error('💡 A user with this email already exists');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
};

// Run the seed function
seedAdmin();
