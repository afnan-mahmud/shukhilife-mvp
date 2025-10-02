const mongoose = require('mongoose');

const landingPageSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    html: { type: String, default: '' },
    active: { type: Boolean, default: true },
    // Optional SEO
    seoTitle: { type: String, default: '' },
    seoDescription: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Pre-save middleware to sync slug with product
landingPageSchema.pre('save', async function(next) {
  if (this.isModified('product') || this.isNew || !this.slug) {
    const product = await mongoose.model('Product').findById(this.product);
    if (product) {
      this.slug = product.slug;
    }
  }
  next();
});

module.exports = mongoose.model('LandingPage', landingPageSchema);
