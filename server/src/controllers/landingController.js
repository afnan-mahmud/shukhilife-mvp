const LandingPage = require('../../models/LandingPage');
const Product = require('../../models/Product');
const mongoose = require('mongoose');
const { isValidObjectId } = mongoose;
const { serializeLanding } = require('../utils/serializers');

/**
 * Get all landing pages (admin-only)
 * GET /api/landing
 */
const getLandingPages = async (req, res) => {
  try {
    const landingPages = await LandingPage.find()
      .populate('product', 'name slug')
      .sort({ updatedAt: -1 });

    const data = landingPages.map(landing => 
      serializeLanding(landing, landing.product)
    );

    res.json({
      ok: true,
      data
    });
  } catch (error) {
    console.error('Get landing pages error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while fetching landing pages'
    });
  }
};

/**
 * Create a new landing page (admin-only)
 * POST /api/landing
 */
const createLandingPage = async (req, res) => {
  try {
    const { productId, html = '', active = true } = req.body;

    // Validate productId
    if (!isValidObjectId(productId)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(400).json({
        ok: false,
        message: 'Product not found'
      });
    }

    // Check if landing page already exists for this product
    const existingLanding = await LandingPage.findOne({ product: productId });
    if (existingLanding) {
      return res.status(400).json({
        ok: false,
        message: 'Landing page already exists for this product'
      });
    }

    // Create new landing page
    const landingPage = new LandingPage({
      product: productId,
      slug: product.slug,
      html: String(html),
      active: !!active
    });

    await landingPage.save();
    await landingPage.populate('product', 'name slug');

    res.status(201).json({
      ok: true,
      data: serializeLanding(landingPage, landingPage.product)
    });
  } catch (error) {
    console.error('Create landing page error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while creating landing page'
    });
  }
};

/**
 * Update a landing page (admin-only)
 * PUT /api/landing/:id
 */
const updateLandingPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, html, active } = req.body;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid landing page ID format'
      });
    }

    // Find the landing page
    const landingPage = await LandingPage.findById(id);
    if (!landingPage) {
      return res.status(404).json({
        ok: false,
        message: 'Landing page not found'
      });
    }

    // If productId is being changed, validate it
    if (productId && productId !== landingPage.product.toString()) {
      if (!isValidObjectId(productId)) {
        return res.status(400).json({
          ok: false,
          message: 'Invalid product ID format'
        });
      }

      const product = await Product.findById(productId);
      if (!product) {
        return res.status(400).json({
          ok: false,
          message: 'Product not found'
        });
      }

      // Check if another landing page exists for the new product
      const existingLanding = await LandingPage.findOne({ 
        product: productId, 
        _id: { $ne: id } 
      });
      if (existingLanding) {
        return res.status(400).json({
          ok: false,
          message: 'Landing page already exists for this product'
        });
      }

      landingPage.product = productId;
      landingPage.slug = product.slug; // Will be updated by pre-save middleware
    }

    // Update other fields
    if (html !== undefined) {
      landingPage.html = String(html);
    }
    if (active !== undefined) {
      landingPage.active = !!active;
    }

    await landingPage.save();
    await landingPage.populate('product', 'name slug');

    res.json({
      ok: true,
      data: serializeLanding(landingPage, landingPage.product)
    });
  } catch (error) {
    console.error('Update landing page error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while updating landing page'
    });
  }
};

/**
 * Delete a landing page (admin-only)
 * DELETE /api/landing/:id
 */
const deleteLandingPage = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        ok: false,
        message: 'Invalid landing page ID format'
      });
    }

    const landingPage = await LandingPage.findByIdAndDelete(id);
    if (!landingPage) {
      return res.status(404).json({
        ok: false,
        message: 'Landing page not found'
      });
    }

    res.json({
      ok: true,
      message: 'Landing page deleted successfully'
    });
  } catch (error) {
    console.error('Delete landing page error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while deleting landing page'
    });
  }
};

/**
 * Get landing page by slug (public)
 * GET /api/landing/by-slug/:slug
 */
const getLandingBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({
        ok: false,
        message: 'Product not found'
      });
    }

    const landingPage = await LandingPage.findOne({ 
      product: product._id, 
      active: true
    });

    if (!landingPage || !landingPage.html || !landingPage.html.trim()) {
      return res.status(404).json({
        ok: false,
        message: 'No active landing page found for this product'
      });
    }

    res.json({
      ok: true,
      data: {
        html: landingPage.html,
        active: landingPage.active
      }
    });
  } catch (error) {
    console.error('Get landing by slug error:', error);
    res.status(500).json({
      ok: false,
      message: 'Internal server error while fetching landing page'
    });
  }
};

module.exports = {
  getLandingPages,
  createLandingPage,
  updateLandingPage,
  deleteLandingPage,
  getLandingBySlug
};
