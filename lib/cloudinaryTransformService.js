/**
 * Cloudinary Transformation Service
 *
 * Generates transformation URLs for images stored in Supabase
 * Uses Cloudinary's fetch feature to transform images without uploading them
 */

// Cloudinary configuration
const CLOUDINARY_CONFIG = {
  cloudName: 'dwl9x9acl',
  fetchBaseUrl: 'https://res.cloudinary.com/dwl9x9acl/image/fetch/'
};

// Hebrew labels for image overlays
const HEBREW_LABELS = {
  name: 'ירון כיוף - שמאות וייעוץ', // Business name
  licence: 'רשיון מספר 1097', // Business license number
  plate: 'לוחית רישוי' // Plate label (car license plate)
};

/**
 * Encode Hebrew text for Cloudinary URL
 * Cloudinary requires special encoding for Hebrew characters
 */
function encodeHebrewForCloudinary(text) {
  if (!text) return '';

  // URL encode the text
  const encoded = encodeURIComponent(text);

  // Cloudinary requires double encoding for Hebrew in text overlays
  return encodeURIComponent(encoded);
}

/**
 * Generate transformation URL for image
 * Replicates the exact formula from Make.com:
 * c_pad,w_850,h_750,g_north,b_ivory,q_auto:good,f_jpg/
 * l_yaronlogo_trans_u7vuyt,w_130/fl_layer_apply,g_south_west,x_30,y_0/
 * co_rgb:000080,l_text:Palatino_22_bold_italic_left:{{Name_Label}}/fl_layer_apply,g_south_east,x_30,y_90/
 * ...etc
 *
 * @param {string} supabaseUrl - Original image URL from Supabase Storage
 * @param {object} options - Transformation options
 * @param {string} options.plate - License plate number (e.g., "12-345-67")
 * @param {string} options.nameLabel - Optional custom business name
 * @param {string} options.licenceLabel - Optional custom business license
 * @param {string} options.plateLabel - Optional custom plate label
 * @returns {string} Full Cloudinary transformation URL
 */
export function generateTransformationUrl(supabaseUrl, options = {}) {
  if (!supabaseUrl) {
    throw new Error('Supabase URL is required');
  }

  // Extract options with defaults
  const {
    plate = '',
    nameLabel = HEBREW_LABELS.name,
    licenceLabel = HEBREW_LABELS.licence,
    plateLabel = HEBREW_LABELS.plate
  } = options;

  // Encode Hebrew text for Cloudinary
  const encodedName = encodeHebrewForCloudinary(nameLabel);
  const encodedLicence = encodeHebrewForCloudinary(licenceLabel);
  const encodedPlateLabel = encodeHebrewForCloudinary(plateLabel);
  const encodedPlate = encodeURIComponent(plate);

  // Build transformation string (exact replica of Make.com formula)
  const transformations = [
    // Base transformations: pad, resize, background, quality, format
    'c_pad,w_850,h_750,g_north,b_ivory,q_auto:good,f_jpg',

    // Logo overlay (Yaron logo)
    'l_yaronlogo_trans_u7vuyt,w_130',
    'fl_layer_apply,g_south_west,x_30,y_0',

    // Business name (top text - light sky blue)
    `co_rgb:3b82f6,l_text:Palatino_22_bold_italic_left:${encodedName}`,
    'fl_layer_apply,g_south_east,x_30,y_90',

    // Business license (light sky blue)
    `co_rgb:3b82f6,l_text:Palatino_20_italic_left:${encodedLicence}`,
    'fl_layer_apply,g_south_east,x_30,y_70',

    // Plate label + actual plate number (bright orange)
    `co_rgb:f97316,l_text:palatino_20_italic_left:${encodedPlateLabel}${encodedPlate ? '%3A%20' + encodedPlate : ''}`,
    'fl_layer_apply,g_south_east,x_30,y_50'
  ].join('/');

  // URL-encode the Supabase URL for Cloudinary fetch
  const encodedSourceUrl = encodeURIComponent(supabaseUrl);

  // Build final Cloudinary fetch URL
  const cloudinaryUrl = `${CLOUDINARY_CONFIG.fetchBaseUrl}${transformations}/${encodedSourceUrl}`;

  console.log('✅ Generated Cloudinary transformation URL:', cloudinaryUrl);

  return cloudinaryUrl;
}

/**
 * Generate simple transformation URL (no overlays)
 * Useful for thumbnails or quick previews
 */
export function generateSimpleTransformationUrl(supabaseUrl, options = {}) {
  const {
    width = 800,
    height = 600,
    quality = 'auto:good',
    format = 'jpg'
  } = options;

  const transformations = `w_${width},h_${height},c_fill,q_${quality},f_${format}`;
  const encodedSourceUrl = encodeURIComponent(supabaseUrl);

  return `${CLOUDINARY_CONFIG.fetchBaseUrl}${transformations}/${encodedSourceUrl}`;
}

/**
 * Generate thumbnail URL
 */
export function generateThumbnailUrl(supabaseUrl) {
  return generateSimpleTransformationUrl(supabaseUrl, {
    width: 200,
    height: 150,
    quality: 'auto:low'
  });
}

/**
 * Batch generate transformation URLs for multiple images
 * @param {Array} images - Array of image objects with { original_url, plate }
 * @returns {Array} Array of images with added transformed_url field
 */
export async function batchGenerateTransformations(images, caseInfo = {}) {
  if (!Array.isArray(images)) {
    throw new Error('Images must be an array');
  }

  return images.map(image => {
    try {
      const transformedUrl = generateTransformationUrl(image.original_url, {
        plate: caseInfo.plate || image.plate || ''
      });

      return {
        ...image,
        transformed_url: transformedUrl,
        transformation_status: 'generated'
      };
    } catch (error) {
      console.error(`Error generating transformation for image ${image.id}:`, error);
      return {
        ...image,
        transformation_status: 'failed',
        transformation_error: error.message
      };
    }
  });
}

/**
 * Test transformation with a sample image
 * Useful for verifying Cloudinary configuration
 */
export function testTransformation(supabaseUrl) {
  console.log('🧪 Testing Cloudinary transformation...');

  const testUrl = generateTransformationUrl(supabaseUrl, {
    plate: '12-345-67'
  });

  console.log('✅ Test transformation URL:', testUrl);
  console.log('🔗 Open this URL in browser to verify transformation works');

  return testUrl;
}

/**
 * Update Cloudinary configuration
 * Call this on app initialization if cloud name is stored in database
 */
export function updateCloudinaryConfig(cloudName) {
  CLOUDINARY_CONFIG.cloudName = cloudName;
  CLOUDINARY_CONFIG.fetchBaseUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/`;

  console.log('✅ Cloudinary config updated:', CLOUDINARY_CONFIG);
}

/**
 * Update Hebrew labels
 * Call this if labels are stored in database or user preferences
 */
export function updateHebrewLabels(labels) {
  Object.assign(HEBREW_LABELS, labels);
  console.log('✅ Hebrew labels updated:', HEBREW_LABELS);
}

// Export configuration for debugging
export { CLOUDINARY_CONFIG, HEBREW_LABELS };
