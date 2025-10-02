const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://dbuser:as;ldjfalsdkjfouopiusadf@cluster0.tqpjjd4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@ecommerce-lite.com',
    password: 'AdminPass123',
    role: 'admin'
  },
  {
    name: 'Support Agent 1',
    email: 'support1@ecommerce-lite.com',
    password: 'SupportPass123',
    role: 'support'
  },
  {
    name: 'Support Agent 2',
    email: 'support2@ecommerce-lite.com',
    password: 'SupportPass123',
    role: 'support'
  },
  {
    name: 'Support Agent 3',
    email: 'support3@ecommerce-lite.com',
    password: 'SupportPass123',
    role: 'support'
  },
  {
    name: 'Packaging Manager',
    email: 'packaging@ecommerce-lite.com',
    password: 'PackagingPass123',
    role: 'packaging'
  }
];

const sampleProducts = [
  {
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    price: 29.99,
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    isActive: true
  },
  {
    name: 'Smart Watch',
    slug: 'smart-watch',
    price: 199.99,
    description: 'Advanced smartwatch with health monitoring, GPS, and water resistance.',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    isActive: true
  },
  {
    name: 'Bluetooth Speaker',
    slug: 'bluetooth-speaker',
    price: 79.99,
    description: 'Portable Bluetooth speaker with excellent sound quality and 12-hour battery.',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500',
    isActive: true
  },
  {
    name: 'Gaming Keyboard',
    slug: 'gaming-keyboard',
    price: 129.99,
    description: 'Mechanical gaming keyboard with RGB lighting and programmable keys.',
    image: 'https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=500',
    isActive: true
  },
  {
    name: 'Wireless Mouse',
    slug: 'wireless-mouse',
    price: 49.99,
    description: 'Ergonomic wireless mouse with precision tracking and long battery life.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
    isActive: true
  },
  {
    name: 'USB-C Hub',
    slug: 'usb-c-hub',
    price: 39.99,
    description: 'Multi-port USB-C hub with HDMI, USB 3.0, and power delivery.',
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500',
    isActive: true
  },
  {
    name: 'Laptop Stand',
    slug: 'laptop-stand',
    price: 24.99,
    description: 'Adjustable aluminum laptop stand for better ergonomics and cooling.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500',
    isActive: true
  },
  {
    name: 'Phone Case',
    slug: 'phone-case',
    price: 19.99,
    description: 'Protective phone case with shock absorption and wireless charging compatibility.',
    image: 'https://images.unsplash.com/photo-1511707171631-5f897ff02aa9?w=500',
    isActive: true
  }
];

const sampleCustomers = [
  { name: 'John Smith', phone: '15550101', email: 'john.smith@email.com' },
  { name: 'Sarah Johnson', phone: '15550102', email: 'sarah.johnson@email.com' },
  { name: 'Mike Davis', phone: '15550103', email: 'mike.davis@email.com' },
  { name: 'Emily Brown', phone: '15550104', email: 'emily.brown@email.com' },
  { name: 'David Wilson', phone: '15550105', email: 'david.wilson@email.com' },
  { name: 'Lisa Anderson', phone: '15550106', email: 'lisa.anderson@email.com' },
  { name: 'Chris Taylor', phone: '15550107', email: 'chris.taylor@email.com' },
  { name: 'Amanda Garcia', phone: '15550108', email: 'amanda.garcia@email.com' },
  { name: 'Robert Martinez', phone: '15550109', email: 'robert.martinez@email.com' },
  { name: 'Jennifer Lee', phone: '15550110', email: 'jennifer.lee@email.com' }
];

const sampleAddresses = [
  '123 Main Street, New York, NY 10001',
  '456 Oak Avenue, Los Angeles, CA 90210',
  '789 Pine Road, Chicago, IL 60601',
  '321 Elm Street, Houston, TX 77001',
  '654 Maple Drive, Phoenix, AZ 85001',
  '987 Cedar Lane, Philadelphia, PA 19101',
  '147 Birch Street, San Antonio, TX 78201',
  '258 Spruce Avenue, San Diego, CA 92101',
  '369 Willow Road, Dallas, TX 75201',
  '741 Poplar Street, San Jose, CA 95101'
];

const orderStatuses = ['pending', 'on_hold', 'call_not_received', 'confirmed', 'canceled', 'completed'];

// Helper function to generate random date within last 30 days
function getRandomDate() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  return new Date(thirtyDaysAgo.getTime() + Math.random() * (now.getTime() - thirtyDaysAgo.getTime()));
}

// Helper function to generate random invoice
function generateInvoice() {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `INV-${dateStr}-${randomNum}`;
}

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function clearDatabase() {
  try {
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Setting.deleteMany({});
    console.log('✅ Database cleared');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
}

async function seedUsers() {
  try {
    console.log('👥 Seeding users...');
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );
    
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

async function seedProducts() {
  try {
    console.log('📦 Seeding products...');
    const createdProducts = await Product.insertMany(sampleProducts);
    console.log(`✅ Created ${createdProducts.length} products`);
    return createdProducts;
  } catch (error) {
    console.error('❌ Error seeding products:', error);
    throw error;
  }
}

async function seedOrders(users, products) {
  try {
    console.log('📋 Seeding orders...');
    const supportUsers = users.filter(user => user.role === 'support');
    const orders = [];
    
    // Generate 50 sample orders
    for (let i = 0; i < 50; i++) {
      const customer = sampleCustomers[Math.floor(Math.random() * sampleCustomers.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
      const amount = product.price * quantity;
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      const assignedSupport = supportUsers[Math.floor(Math.random() * supportUsers.length)];
      
      // Generate some orders with Steadfast integration
      const hasSteadfast = Math.random() > 0.7; // 30% chance
      const steadfast = hasSteadfast ? {
        sent: true,
        consignmentId: `CONS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        sentAt: getRandomDate(),
        lastError: null
      } : {
        sent: false,
        consignmentId: null,
        sentAt: null,
        lastError: null
      };
      
      // Generate some notes
      const notes = [];
      if (Math.random() > 0.5) { // 50% chance of having notes
        const noteAuthors = users.filter(u => ['admin', 'support'].includes(u.role));
        const noteAuthor = noteAuthors[Math.floor(Math.random() * noteAuthors.length)];
        const noteTexts = [
          'Customer confirmed order details',
          'Payment received successfully',
          'Order ready for packaging',
          'Customer requested expedited shipping',
          'Address verification completed',
          'Product out of stock, checking alternatives',
          'Customer called to update address',
          'Order dispatched successfully'
        ];
        
        notes.push({
          author: noteAuthor._id,
          text: noteTexts[Math.floor(Math.random() * noteTexts.length)],
          createdAt: getRandomDate()
        });
      }
      
      const order = {
        invoice: generateInvoice(),
        customerName: customer.name,
        phone: customer.phone,
        altPhone: Math.random() > 0.7 ? `1555${Math.floor(Math.random() * 9000) + 1000}` : '',
        email: customer.email,
        address: sampleAddresses[Math.floor(Math.random() * sampleAddresses.length)],
        product: product._id,
        productSnapshot: {
          name: product.name,
          price: product.price,
          image: product.image
        },
        quantity,
        amount,
        status,
        assignedTo: assignedSupport._id,
        notes,
        steadfast,
        createdAt: getRandomDate(),
        updatedAt: new Date()
      };
      
      orders.push(order);
    }
    
    const createdOrders = await Order.insertMany(orders);
    console.log(`✅ Created ${createdOrders.length} orders`);
    return createdOrders;
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  }
}

async function seedSettings() {
  try {
    console.log('⚙️ Seeding settings...');
    const settings = [
      {
        key: 'lastAssignedSupportId',
        value: '',
        description: 'ID of the last support user assigned an order for round-robin'
      },
      {
        key: 'appVersion',
        value: '1.0.0',
        description: 'Current application version'
      },
      {
        key: 'maintenanceMode',
        value: 'false',
        description: 'Whether the application is in maintenance mode'
      }
    ];
    
    const createdSettings = await Setting.insertMany(settings);
    console.log(`✅ Created ${createdSettings.length} settings`);
    return createdSettings;
  } catch (error) {
    console.error('❌ Error seeding settings:', error);
    throw error;
  }
}

async function generateStatistics(users, products, orders) {
  console.log('\n📊 Database Statistics:');
  console.log('====================');
  console.log(`👥 Users: ${users.length}`);
  console.log(`   - Admin: ${users.filter(u => u.role === 'admin').length}`);
  console.log(`   - Support: ${users.filter(u => u.role === 'support').length}`);
  console.log(`   - Packaging: ${users.filter(u => u.role === 'packaging').length}`);
  console.log(`📦 Products: ${products.length}`);
  console.log(`📋 Orders: ${orders.length}`);
  console.log(`   - Pending: ${orders.filter(o => o.status === 'pending').length}`);
  console.log(`   - Confirmed: ${orders.filter(o => o.status === 'confirmed').length}`);
  console.log(`   - Completed: ${orders.filter(o => o.status === 'completed').length}`);
  console.log(`   - Canceled: ${orders.filter(o => o.status === 'canceled').length}`);
  console.log(`   - With Steadfast: ${orders.filter(o => o.steadfast.sent).length}`);
  
  const totalRevenue = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.amount, 0);
  console.log(`💰 Total Revenue: $${totalRevenue.toFixed(2)}`);
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...\n');
    
    await connectToDatabase();
    await clearDatabase();
    
    const users = await seedUsers();
    const products = await seedProducts();
    const orders = await seedOrders(users, products);
    const settings = await seedSettings();
    
    await generateStatistics(users, products, orders);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('===================');
    console.log('Admin: admin@ecommerce-lite.com / AdminPass123');
    console.log('Support: support1@ecommerce-lite.com / SupportPass123');
    console.log('Packaging: packaging@ecommerce-lite.com / PackagingPass123');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

module.exports = { main };
