# Pixel Tracking Implementation

This directory contains the pixel tracking implementation for Meta (Facebook) and TikTok pixels.

## Files

- `PixelManager.jsx` - Main component that manages pixel loading based on routes
- `pixelUtils.js` - Utility functions for tracking events
- `README.md` - This documentation

## How It Works

### Route-Based Loading

The `PixelManager` component only loads pixels on public product landing pages (`/p/:slug`) and not on admin, support, or packaging routes.

**Routes that load pixels:**
- `/p/wireless-headphones` ✅
- `/p/any-product-slug` ✅

**Routes that do NOT load pixels:**
- `/` (Home) ❌
- `/admin/*` ❌
- `/support/*` ❌
- `/packaging/*` ❌
- `/login` ❌
- `/thank-you` ❌

### Environment Variables

Set these in your `.env` file:

```env
VITE_META_PIXEL_ID=your_meta_pixel_id_here
VITE_TIKTOK_PIXEL_ID=your_tiktok_pixel_id_here
```

### Events Tracked

#### Automatic Events
- **PageView**: Fired when visiting a product landing page
- **ViewContent**: Fired when viewing a product (with product slug)

#### Manual Events (via pixelUtils.js)
- **Purchase**: Fired when order is completed
- **AddToCart**: Fired when quantity is increased
- **Lead**: Fired when form is submitted
- **Custom Events**: For any custom tracking needs

### Usage

#### In Components

```jsx
import { trackPurchase, trackAddToCart } from '../pixels/pixelUtils';

// Track purchase
trackPurchase(invoice, totalAmount, 'USD', productSlug);

// Track add to cart
trackAddToCart(productSlug, value, 'USD');
```

#### Check Pixel Status

```jsx
import { getPixelStatus } from '../pixels/pixelUtils';

const status = getPixelStatus();
console.log(status);
// { metaPixel: true, tiktokPixel: true, metaPixelId: '123...', tiktokPixelId: 'ABC...' }
```

## Testing

### Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to different routes
4. Check for pixel requests:
   - Meta Pixel: `connect.facebook.net`
   - TikTok Pixel: `analytics.tiktok.com`

### Test Script

Load the test script in browser console:

```javascript
// Test current route
testPixelBehavior();

// Test all routes
runAllTests();
```

### Expected Behavior

- **Product Landing Pages**: Should see pixel scripts loaded and network requests
- **All Other Pages**: Should NOT see any pixel scripts or requests

## Implementation Details

### PixelManager Component

- Wraps the entire app
- Monitors route changes
- Loads/removes pixels based on current route
- Handles cleanup when navigating away from product pages

### Script Injection

- Dynamically injects pixel scripts into `<head>`
- Adds noscript fallbacks for Meta Pixel
- Properly cleans up when navigating away
- Prevents duplicate script loading

### Event Tracking

- Automatic PageView and ViewContent on product pages
- Manual event tracking via utility functions
- Consistent event parameters across platforms
- Console logging for debugging

## Troubleshooting

### Pixels Not Loading

1. Check environment variables are set
2. Verify you're on a product landing page (`/p/:slug`)
3. Check browser console for errors
4. Verify network requests in DevTools

### Pixels Loading on Wrong Pages

1. Check route detection logic in `PixelManager.jsx`
2. Verify route patterns match expected behavior
3. Test with different route combinations

### Events Not Firing

1. Check if pixels are loaded (`getPixelStatus()`)
2. Verify event parameters
3. Check browser console for errors
4. Test with manual event calls

## Security

- Pixels only load on public product pages
- No tracking on admin/support/packaging areas
- Environment variables for configuration
- Proper cleanup to prevent memory leaks
