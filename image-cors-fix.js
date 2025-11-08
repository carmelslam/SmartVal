/**
 * Image CORS Fix Utility
 * Replaces external images with fallback alternatives to avoid CORS issues in html2canvas
 */

// Known image mappings - replace CORS-blocked external images with safe alternatives
const IMAGE_MAPPINGS = {
  'https://carmelcayouf.com/wp-content/uploads/2025/06/g.webp': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzNiODJmNiIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxPR088L3RleHQ+Cjwvc3ZnPg==',
  'https://carmelcayouf.com/wp-content/uploads/2025/04/yaron-signature-transparent-.webp': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iODAiIGZpbGw9Im5vbmUiIC8+CiAgPHRleHQgeD0iMTAwIiB5PSI0NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSIjMzMzIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7Xmdeo15XXnSfXmyDXmdeZ15XXmdWMvdGO8L3RjiBkdW1teS48L3RleHQ+Cjwvc3ZnPg==',
  'https://assets.carmelcayouf.com/assets/bg-report.png': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPGRlZnM+CiAgICA8cGF0dGVybiBpZD0iYmciIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+CiAgICAgIDxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI2Y4ZmFmYyIgLz4KICAgICAgPGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjEiIGZpbGw9IiNlMmU4ZjAiIC8+CiAgICA8L3BhdHRlcm4+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0idXJsKCNiZykiIC8+Cjwvc3ZnPg=='
};

/**
 * Replace external image URLs with safe alternatives
 */
function getSafeImageUrl(imageUrl) {
  // Check if we have a known mapping for this URL
  if (IMAGE_MAPPINGS[imageUrl]) {
    console.log(`🔄 Replacing CORS-blocked image: ${imageUrl}`);
    return IMAGE_MAPPINGS[imageUrl];
  }
  
  // For unknown external URLs, return a generic placeholder
  if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
    console.warn(`⚠️ Unknown external image, using placeholder: ${imageUrl}`);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPg==';
  }
  
  // Return the original URL if it's already a data URI or relative path
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