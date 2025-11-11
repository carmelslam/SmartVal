/**
 * Image CORS Fix Utility
 * Replaces external images with fallback alternatives to avoid CORS issues in html2canvas
 */

// Known image mappings - replace CORS-blocked external images with safe alternatives
const IMAGE_MAPPINGS = {
  // Professional logo replacement - blue circle with "YC" initials for Yaron Cayouf
  'https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibG9nb0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMjU2M2ViO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxZDRlZDg7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0idXJsKCNsb2dvR3JhZCkiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPHRleHQgeD0iNTAiIHk9IjU4IiBmb250LWZhbWlseT0iSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ZQzwvdGV4dD4KPC9zdmc+',
  
  // Alternative logo URLs
  'https://carmelcayouf.com/wp-content/uploads/2025/04/logo-yaron.webp': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibG9nb0dyYWQyIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzI1NjNlYjtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWQ0ZWQ4O3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDgiIGZpbGw9InVybCgjbG9nb0dyYWQyKSIgc3Ryb2tlPSIjMWYyOTM3IiBzdHJva2Utd2lkdGg9IjQiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTgiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjI4IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPllDPC90ZXh0Pgo8L3N2Zz4=',
  
  // Professional signature replacement - Hebrew signature style
  'https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDx0ZXh0IHg9IjEwMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMyNTYzZWIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPtee16jXldefINeS15nXldeTPC90ZXh0PgogIDx0ZXh0IHg9IjEwMCIgeT0iNDgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+16nXnteQ15kg16jXmdeRINeV15TXoteo15vXqSDXoNeW15nXmdedPC90ZXh0PgogIDx0ZXh0IHg9IjEwMCIgeT0iNjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGljLiMgMTIzNDU2PC90ZXh0Pgo8L3N2Zz4=',
  
  // Subtle background pattern replacement
  'https://assets.carmelcayouf.com/assets/bg-report.png': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxwYXR0ZXJuIGlkPSJiZ1BhdHRlcm4iIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+CiAgICAgIDxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZiZmJmYiIvPgogICAgICA8Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiNmMGY0ZjgiLz4KICAgIDwvcGF0dGVybj4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNiZ1BhdHRlcm4pIi8+Cjwvc3ZnPg=='
};

// Domain patterns to catch any carmelcayouf.com images
const CORS_DOMAINS = [
  'carmelcayouf.com',
  'assets.carmelcayouf.com',
  'cdn.carmelcayouf.com'
];

// 🔧 PHASE 10 FIX: Whitelist Supabase Storage domains (these are safe to use)
const ALLOWED_DOMAINS = [
  'supabase.co', // Supabase Storage
  'nvqrptokmwdhvpiufrad.supabase.co' // Specific Supabase project
];

/**
 * Replace external image URLs with safe alternatives
 */
function getSafeImageUrl(imageUrl) {
  // 🔧 PHASE 10 EMERGENCY FIX: DISABLE ALL IMAGE REPLACEMENT
  // The hardcoded YC logos and signatures are interfering with user assets
  // Just return the original URL without any replacements
  return imageUrl;
}

/**
 * Replace all external images in a document with safe alternatives
 */
async function fixImagesForPDF(document) {
  console.log('🔧 Replacing CORS-blocked external images with safe alternatives...');
  
  const images = document.querySelectorAll('img');
  let replacedCount = 0;
  
  for (const img of images) {
    if (img.src && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
      const originalSrc = img.src;
      const safeSrc = getSafeImageUrl(originalSrc);
      if (safeSrc !== originalSrc) {
        img.src = safeSrc;
        replacedCount++;
        console.log(`✅ Replaced image: ${img.alt || 'unnamed'}`);
      }
    }
  }
  
  // Also fix background images in CSS
  const elementsWithBgImage = document.querySelectorAll('[style*="background-image"]');
  for (const element of elementsWithBgImage) {
    const style = element.style.backgroundImage;
    if (style && style.includes('url(')) {
      const urlMatch = style.match(/url\(['"]?([^'"()]+)['"]?\)/);
      if (urlMatch && urlMatch[1] && (urlMatch[1].startsWith('http://') || urlMatch[1].startsWith('https://'))) {
        const originalUrl = urlMatch[1];
        const safeUrl = getSafeImageUrl(originalUrl);
        if (safeUrl !== originalUrl) {
          element.style.backgroundImage = `url(${safeUrl})`;
          replacedCount++;
          console.log('✅ Replaced background image');
        }
      }
    }
  }
  
  console.log(`✅ Replaced ${replacedCount} external images with safe alternatives`);
  
  // Additional verification - log all remaining external images
  const remainingExternalImages = document.querySelectorAll('img[src^="http"], img[src^="https"]');
  if (remainingExternalImages.length > 0) {
    console.warn(`⚠️ ${remainingExternalImages.length} external images still found:`);
    remainingExternalImages.forEach(img => console.warn(`  - ${img.src}`));
  }
}

/**
 * Enhanced html2canvas options with CORS handling
 */
const HTML2CANVAS_OPTIONS = {
  scale: 1,
  useCORS: true,
  allowTaint: true,
  logging: false,
  imageTimeout: 0,
  backgroundColor: '#ffffff',
  removeContainer: true,
  foreignObjectRendering: false, // Disable to avoid CORS issues
  ignoreElements: (element) => {
    // Don't ignore any images - we want all images including logo, signatures, stamps
    return false;
  }
};

// Export for use in other modules
window.ImageCorsFix = {
  getSafeImageUrl,
  fixImagesForPDF,
  HTML2CANVAS_OPTIONS
};