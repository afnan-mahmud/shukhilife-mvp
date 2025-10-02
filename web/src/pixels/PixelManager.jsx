import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const PixelManager = ({ children }) => {
  const location = useLocation();
  const metaPixelLoaded = useRef(false);
  const tiktokPixelLoaded = useRef(false);

  // Check if current route is a public product landing page
  const isProductLandingPage = (pathname) => {
    return pathname.match(/^\/p\/[^\/]+$/) && 
           !pathname.startsWith('/admin') && 
           !pathname.startsWith('/support') && 
           !pathname.startsWith('/packaging');
  };

  // Load Meta Pixel script
  const loadMetaPixel = () => {
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    if (!pixelId || metaPixelLoaded.current) return;

    // Create script element
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    script.id = 'meta-pixel-script';
    document.head.appendChild(script);

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1" />`;
    noscript.id = 'meta-pixel-noscript';
    document.body.appendChild(noscript);

    metaPixelLoaded.current = true;
    console.log('Meta Pixel loaded for product landing page');
  };

  // Load TikTok Pixel script
  const loadTikTokPixel = () => {
    const pixelId = import.meta.env.VITE_TIKTOK_PIXEL_ID;
    if (!pixelId || tiktokPixelLoaded.current) return;

    // Create script element
    const script = document.createElement('script');
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["track","page","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${pixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    script.id = 'tiktok-pixel-script';
    document.head.appendChild(script);

    tiktokPixelLoaded.current = true;
    console.log('TikTok Pixel loaded for product landing page');
  };

  // Remove pixel scripts
  const removePixels = () => {
    // Remove Meta Pixel
    const metaScript = document.getElementById('meta-pixel-script');
    const metaNoscript = document.getElementById('meta-pixel-noscript');
    if (metaScript) {
      metaScript.remove();
      metaPixelLoaded.current = false;
    }
    if (metaNoscript) {
      metaNoscript.remove();
    }

    // Remove TikTok Pixel
    const tiktokScript = document.getElementById('tiktok-pixel-script');
    if (tiktokScript) {
      tiktokScript.remove();
      tiktokPixelLoaded.current = false;
    }

    // Clear global pixel objects
    if (window.fbq) {
      delete window.fbq;
    }
    if (window.ttq) {
      delete window.ttq;
    }
  };

  // Track ViewContent event for product pages
  const trackViewContent = (pathname) => {
    const slug = pathname.split('/p/')[1];
    if (!slug) return;

    // Meta Pixel ViewContent
    if (window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_type: 'product',
        content_ids: [slug],
        value: 0,
        currency: 'USD'
      });
      console.log('Meta Pixel ViewContent tracked for:', slug);
    }

    // TikTok Pixel ViewContent
    if (window.ttq) {
      window.ttq.track('ViewContent', {
        content_type: 'product',
        content_id: slug,
        value: 0,
        currency: 'USD'
      });
      console.log('TikTok Pixel ViewContent tracked for:', slug);
    }
  };

  // Handle route changes
  useEffect(() => {
    const currentPath = location.pathname;
    const isProductPage = isProductLandingPage(currentPath);

    if (isProductPage) {
      // Load pixels for product landing pages
      loadMetaPixel();
      loadTikTokPixel();
      
      // Track ViewContent after a short delay to ensure pixels are loaded
      setTimeout(() => {
        trackViewContent(currentPath);
      }, 1000);
    } else {
      // Remove pixels for admin/support/packaging pages
      removePixels();
    }

    // Cleanup on unmount
    return () => {
      // Only remove pixels if navigating away from product pages
      if (!isProductPage) {
        removePixels();
      }
    };
  }, [location.pathname]);

  return <>{children}</>;
};

export default PixelManager;
