const Product = require('../../models/Product');
const { validationResult } = require('express-validator');
const { mapMongooseError } = require('../utils/errorMapper');

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Create a new product (admin-only)
 * POST /api/products
 */
const createProduct = async (req, res) => {
  try {
    // express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, description, price, imageUrl, isActive, slug } = req.body;

    const payload = {
      name: String(name).trim(),
      description: String(description).trim(),
      imageUrl: String(imageUrl).trim(),
      isActive: typeof isActive === 'boolean' ? isActive : Boolean(isActive),
      // coerce price to Number
      price: typeof price === 'number' ? price : Number(String(price).replace(/[^\d.]/g, '')),
      slug: slug ? String(slug).trim().toLowerCase() : slugify(String(name || '')),
    };

    // Basic guardrails
    if (!payload.name) return res.status(400).json({ message: 'Name is required' });
    if (!payload.description) return res.status(400).json({ message: 'Description is required' });
    if (!payload.imageUrl) return res.status(400).json({ message: 'Image URL is required' });
    if (Number.isNaN(payload.price)) return res.status(400).json({ message: 'Price must be a number' });

    const doc = await Product.create(payload);
    return res.status(201).json(doc);
  } catch (err) {
    console.error('Create product error:', err);
    const { status, message } = mapMongooseError(err);
    return res.status(status).json({ message });
  }
};

/**
 * Get all products with optional filtering
 * GET /api/products?active=1
 */
const getProducts = async (req, res) => {
  try {
    const { active } = req.query;
    
    // Build filter object
    const filter = {};
    if (active === '1') {
      filter.isActive = true;
    }

    const products = await Product.find(filter)
      .select('_id name slug price imageUrl description isActive createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      products: products.map(product => ({
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        formattedPrice: product.formattedPrice,
        image: product.imageUrl,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt
      }))
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching products'
    });
  }
};

/**
 * Get product by ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        formattedPrice: product.formattedPrice,
        image: product.imageUrl,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt
      }
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching product'
    });
  }
};

/**
 * Get product by slug (public endpoint)
 * GET /api/products/slug/:slug
 */
const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug: slug.toLowerCase(), isActive: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        formattedPrice: product.formattedPrice,
        image: product.imageUrl,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt
      }
    });
  } catch (error) {
    console.error('Get product by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while fetching product'
    });
  }
};

/**
 * Update product (admin-only)
 * PATCH /api/products/:id
 */
const updateProduct = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { name, slug, price, imageUrl, description, isActive } = req.body;

    // Find product by ID
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if slug is being changed and if new slug already exists
    if (slug && slug.toLowerCase() !== product.slug) {
      const existingProduct = await Product.findOne({ 
        slug: slug.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: 'Product with this slug already exists'
        });
      }
    }

    // Update product fields
    if (name !== undefined) product.name = name.trim();
    if (slug !== undefined) product.slug = slug.toLowerCase().trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
    if (description !== undefined) product.description = description.trim();
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: {
        id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        formattedPrice: product.formattedPrice,
        image: product.imageUrl,
        description: product.description,
        isActive: product.isActive,
        createdAt: product.createdAt
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while updating product'
    });
  }
};

/**
 * Delete product (admin-only)
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while deleting product'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  getProductBySlug,
  updateProduct,
  deleteProduct
};

