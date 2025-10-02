const mongoose = require('mongoose');
const LandingPage = require('../models/LandingPage');
const Product = require('../models/Product');

async function migrateLandingFields() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite');
    console.log('Connected to database');

    const landingPages = await LandingPage.find({});
    console.log(`Found ${landingPages.length} landing pages to migrate`);

    for (const landing of landingPages) {
      console.log(`Migrating landing page: ${landing._id}`);
      
      // Get the product to get the slug
      const product = await Product.findById(landing.product);
      if (!product) {
        console.log(`Product not found for landing page: ${landing._id}`);
        continue;
      }

      // Update the landing page with new field names
      await LandingPage.updateOne(
        { _id: landing._id },
        {
          $set: {
            slug: product.slug,
            html: landing.contentHtml || '',
            active: landing.isActive !== undefined ? landing.isActive : true
          },
          $unset: {
            contentHtml: 1,
            isActive: 1
          }
        }
      );

      console.log(`✓ Migrated landing page: ${product.slug}`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

migrateLandingFields();
