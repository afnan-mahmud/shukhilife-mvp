// Pixel utility functions for tracking events

/**
 * Track a purchase event
 * @param {string} invoice - Order invoice number
 * @param {number} value - Order total value
 * @param {string} currency - Currency code (default: USD)
 * @param {string} productSlug - Product slug
 */
export const trackPurchase = (invoice, value, currency = 'USD', productSlug = null) => {
  // Meta Pixel Purchase event
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value,
      currency: currency,
      content_type: 'product',
      content_ids: productSlug ? [productSlug] : undefined,
      order_id: invoice
    });
    console.log('Meta Pixel Purchase tracked:', { invoice, value, currency });
  }

  // TikTok Pixel Purchase event
  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      value: value,
      currency: currency,
      content_type: 'product',
      content_id: productSlug,
      order_id: invoice
    });
    console.log('TikTok Pixel Purchase tracked:', { invoice, value, currency });
  }
};

/**
 * Track an add to cart event
 * @param {string} productSlug - Product slug
 * @param {number} value - Product value
 * @param {string} currency - Currency code (default: USD)
 */
export const trackAddToCart = (productSlug, value, currency = 'USD') => {
  // Meta Pixel AddToCart event
  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_type: 'product',
      content_ids: [productSlug],
      value: value,
      currency: currency
    });
    console.log('Meta Pixel AddToCart tracked:', { productSlug, value, currency });
  }

  // TikTok Pixel AddToCart event
  if (window.ttq) {
    window.ttq.track('AddToCart', {
      content_type: 'product',
      content_id: productSlug,
      value: value,
      currency: currency
    });
    console.log('TikTok Pixel AddToCart tracked:', { productSlug, value, currency });
  }
};

/**
 * Track a lead event (form submission)
 * @param {string} formType - Type of form (e.g., 'checkout', 'contact')
 * @param {Object} formData - Form data object
 */
export const trackLead = (formType, formData = {}) => {
  // Meta Pixel Lead event
  if (window.fbq) {
    window.fbq('track', 'Lead', {
      content_name: formType,
      content_category: 'form_submission',
      value: 0,
      currency: 'USD'
    });
    console.log('Meta Pixel Lead tracked:', { formType, formData });
  }

  // TikTok Pixel Lead event
  if (window.ttq) {
    window.ttq.track('CompleteRegistration', {
      content_type: formType,
      content_category: 'form_submission',
      value: 0,
      currency: 'USD'
    });
    console.log('TikTok Pixel Lead tracked:', { formType, formData });
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Event name
 * @param {Object} parameters - Event parameters
 */
export const trackCustomEvent = (eventName, parameters = {}) => {
  // Meta Pixel custom event
  if (window.fbq) {
    window.fbq('trackCustom', eventName, parameters);
    console.log('Meta Pixel custom event tracked:', { eventName, parameters });
  }

  // TikTok Pixel custom event
  if (window.ttq) {
    window.ttq.track(eventName, parameters);
    console.log('TikTok Pixel custom event tracked:', { eventName, parameters });
  }
};

/**
 * Check if pixels are loaded
 * @returns {Object} Object with pixel loading status
 */
export const getPixelStatus = () => {
  return {
    metaPixel: !!window.fbq,
    tiktokPixel: !!window.ttq,
    metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
    tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID
  };
};
