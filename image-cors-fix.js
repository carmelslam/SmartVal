/**
 * Image CORS Fix Utility
 * Converts external images to data URIs to avoid CORS issues in html2canvas
 */

/**
 * Convert image URL to data URI using a proxy approach
 */
async function imageToDataUri(imageUrl) {
  try {
    // Create a canvas element to convert image to data URI
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      img.onload = function() {
        canvas.width = this.width;
        canvas.height = this.height;
        ctx.drawImage(this, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = function() {
        console.warn(`Failed to load image: ${imageUrl}`);
        // Return a small transparent pixel as fallback
        resolve('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==');
      };
      
      // Set crossOrigin to handle CORS
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error converting image to data URI:', error);
    // Return transparent pixel fallback
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }
}

/**
 * Replace all external images in a document with data URIs
 */
async function fixImagesForPDF(document) {
  console.log('🔧 Converting external images to data URIs to fix CORS issues...');
  
  const images = document.querySelectorAll('img');
  const imagePromises = [];
  
  for (const img of images) {
    if (img.src && (img.src.startsWith('http://') || img.src.startsWith('https://'))) {
      const promise = imageToDataUri(img.src).then(dataUri => {
        img.src = dataUri;
        console.log(`✅ Converted image: ${img.alt || 'unnamed'}`);
      }).catch(error => {
        console.warn(`⚠️ Failed to convert image: ${img.src}`, error);
      });
      imagePromises.push(promise);
    }
  }
  
  // Also fix background images in CSS
  const elementsWithBgImage = document.querySelectorAll('[style*="background-image"]');
  for (const element of elementsWithBgImage) {
    const style = element.style.backgroundImage;
    if (style && style.includes('url(')) {
      const urlMatch = style.match(/url\(['"]?([^'"()]+)['"]?\)/);
      if (urlMatch && urlMatch[1] && (urlMatch[1].startsWith('http://') || urlMatch[1].startsWith('https://'))) {
        try {
          const dataUri = await imageToDataUri(urlMatch[1]);
          element.style.backgroundImage = `url(${dataUri})`;
          console.log('✅ Converted background image');
        } catch (error) {
          console.warn('⚠️ Failed to convert background image:', error);
        }
      }
    }
  }
  
  // Wait for all image conversions to complete
  await Promise.all(imagePromises);
  console.log('✅ All images converted to data URIs');
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
  imageToDataUri,
  fixImagesForPDF,
  HTML2CANVAS_OPTIONS
};