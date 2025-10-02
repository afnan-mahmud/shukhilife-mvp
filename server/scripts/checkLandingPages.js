const mongoose = require('mongoose');
const LandingPage = require('../models/LandingPage');

async function checkLandingPages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-lite');
    console.log('Connected to database');

    const landingPages = await LandingPage.find({});
    console.log('All landing pages:');
    landingPages.forEach(lp => {
      console.log({
        id: lp._id,
        product: lp.product,
        slug: lp.slug,
        html: lp.html,
        active: lp.active
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkLandingPages();
