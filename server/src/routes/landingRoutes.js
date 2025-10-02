const express = require('express');
const { body } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');
const landingController = require('../controllers/landingController');

const router = express.Router();

// Admin routes
router.get('/', requireAuth, requireRole('admin'), landingController.getLandingPages);
router.post('/', requireAuth, requireRole('admin'), [
  body('productId').isMongoId().withMessage('productId is required'),
  body('html').optional().isString(),
  body('active').optional().isBoolean(),
], landingController.createLandingPage);
router.put('/:id', requireAuth, requireRole('admin'), [
  body('productId').optional().isMongoId(),
  body('html').optional().isString(),
  body('active').optional().isBoolean(),
], landingController.updateLandingPage);
router.delete('/:id', requireAuth, requireRole('admin'), landingController.deleteLandingPage);

// Public routes
router.get('/by-slug/:slug', landingController.getLandingBySlug);

module.exports = router;
