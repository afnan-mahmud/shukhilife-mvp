const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://dbuser:as;ldjfalsdkjfouopiusadf@cluster0.tqpjjd4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function verifyData() {
  try {
    console.log('🔍 Verifying seeded data...\n');
    
    // Count documents
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const settingCount = await Setting.countDocuments();
    
    console.log('📊 Document Counts:');
    console.log(`👥 Users: ${userCount}`);
    console.log(`📦 Products: ${productCount}`);
    console.log(`📋 Orders: ${orderCount}`);
    console.log(`⚙️ Settings: ${settingCount}\n`);
    
    // Verify users
    console.log('👥 User Details:');
    const users = await User.find({}, 'name email role').sort({ role: 1, name: 1 });
    users.forEach(user => {
      console.log(`   ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
    });
    
    // Verify products
    console.log('\n📦 Product Details:');
    const products = await Product.find({}, 'name price isActive').sort({ name: 1 });
    products.forEach(product => {
      console.log(`   ${product.name}: $${product.price} (${product.isActive ? 'Active' : 'Inactive'})`);
    });
    
    // Verify orders by status
    console.log('\n📋 Order Status Breakdown:');
    const statusCounts = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count}`);
    });
    
    // Verify Steadfast integration
    const steadfastCount = await Order.countDocuments({ 'steadfast.sent': true });
    console.log(`   With Steadfast: ${steadfastCount}`);
    
    // Calculate revenue
    const revenueResult = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    console.log(`   Total Revenue: $${totalRevenue.toFixed(2)}`);
    
    // Verify settings
    console.log('\n⚙️ Settings:');
    const settings = await Setting.find({}, 'key value description');
    settings.forEach(setting => {
      console.log(`   ${setting.key}: ${setting.value} (${setting.description})`);
    });
    
    // Sample orders
    console.log('\n📋 Sample Orders:');
    const sampleOrders = await Order.find({})
      .populate('assignedTo', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    sampleOrders.forEach(order => {
      console.log(`   ${order.invoice}: ${order.customerName} - ${order.productSnapshot.name} x${order.quantity} - $${order.amount} (${order.status})`);
      console.log(`      Assigned to: ${order.assignedTo.name} (${order.assignedTo.email})`);
      if (order.steadfast.sent) {
        console.log(`      Steadfast: ${order.steadfast.consignmentId}`);
      }
    });
    
    console.log('\n✅ Data verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await connectToDatabase();
    await verifyData();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the verification script
if (require.main === module) {
  main();
}

module.exports = { main };
