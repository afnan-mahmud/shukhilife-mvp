const mongoose = require('mongoose');
const LandingPage = require('../models/LandingPage');
const Product = require('../models/Product');

async function migrateLandingPages() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite');
    console.log('Connected to database');

    // Find all landing pages
    const landingPages = await LandingPage.find({}).populate('product', 'slug');

    console.log(`Found ${landingPages.length} landing pages to migrate`);

    for (const landing of landingPages) {
      console.log(`Migrating landing page for product: ${landing.product?.name}`);
      
      // Update slug from product
      if (landing.product?.slug) {
        landing.slug = landing.product.slug;
      }
      
      // Set default html if not exists
      if (landing.html === undefined || landing.html === null) {
        landing.html = '';
      }
      
      // Set default active if not exists
      if (landing.active === undefined || landing.active === null) {
        landing.active = true;
      }
      
      await landing.save();
      console.log(`✓ Updated landing page: ${landing.slug}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

migrateLandingPages();
