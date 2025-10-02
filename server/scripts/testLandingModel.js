const mongoose = require('mongoose');
const LandingPage = require('../models/LandingPage');

async function testLandingModel() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite');
    console.log('Connected to database');

    // Test creating a new landing page
    const testLanding = new LandingPage({
      product: '68de4e3b4abf4b0c0e8d0e3a',
      html: '<div>Test HTML</div>',
      active: true
    });

    console.log('Test landing page before save:', {
      slug: testLanding.slug,
      html: testLanding.html,
      active: testLanding.active
    });

    await testLanding.save();
    console.log('Test landing page after save:', {
      id: testLanding._id,
      slug: testLanding.slug,
      html: testLanding.html,
      active: testLanding.active
    });

    // Clean up
    await LandingPage.findByIdAndDelete(testLanding._id);
    console.log('Test landing page deleted');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testLandingModel();
