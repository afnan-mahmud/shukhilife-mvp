const mongoose = require('mongoose');
const LandingPage = require('../models/LandingPage');
const Product = require('../models/Product');

async function fixLandingPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite');
    console.log('Connected to database');

    const landingPages = await LandingPage.find({});
    console.log(`Found ${landingPages.length} landing pages to fix`);

    for (const landing of landingPages) {
      console.log(`Fixing landing page: ${landing._id}`);
      
      // Get the product to get the slug
      const product = await Product.findById(landing.product);
      if (!product) {
        console.log(`Product not found for landing page: ${landing._id}`);
        continue;
      }

      // Update the landing page directly
      await LandingPage.updateOne(
        { _id: landing._id },
        {
          $set: {
            slug: product.slug,
            html: landing.html || '',
            active: landing.active !== undefined ? landing.active : true
          }
        }
      );

      console.log(`✓ Fixed landing page: ${product.slug}`);
    }

    console.log('Fix completed successfully');
  } catch (error) {
    console.error('Fix failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixLandingPages();
