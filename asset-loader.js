// =====================================================
// Phase 10: Asset Loader Utility
// Purpose: Load and inject user-specific assets (logos, signatures, stamps) into PDFs
// Date: 2025-11-09
// =====================================================
//
// This module provides functionality to:
// - Load user assets from sessionStorage (populated by authService)
// - Inject asset URLs into HTML image elements
// - Provide fallback handling for missing assets
//
// Usage:
//   import { assetLoader } from './asset-loader.js';
//   assetLoader.loadFromSession();
//   assetLoader.injectAssets(document);
//
// =====================================================

export class AssetLoader {
  constructor() {
    this.assets = null;
  }

  /**
   * Load assets from sessionStorage (populated during login by authService)
   * @returns {object} - Assets object with URLs
   */
  loadFromSession() {
    try {
      const auth = JSON.parse(sessionStorage.getItem('auth') || '{}');
      this.assets = auth.assets || {};

      console.log('✅ AssetLoader: Loaded assets from session:', {
        hasLogo: !!this.assets.company_logo_url,
        hasStamp: !!this.assets.company_stamp_url,
        hasSignature: !!this.assets.user_signature_url,
        hasBackground: !!this.assets.background_url
      });

      return this.assets;
    } catch (error) {
      console.error('❌ AssetLoader: Failed to load assets from session:', error);
      this.assets = {};
      return {};
    }
  }

  /**
   * Fetch fresh assets from Supabase (if needed)
   * @param {object} supabase - Supabase client instance
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Assets object with URLs
   */
  async fetchAssets(supabase, userId) {
    try {
      console.log('🔄 AssetLoader: Fetching fresh assets from Supabase...');

      const { data, error } = await supabase
        .from('user_assets')
        .select('company_logo_url, company_stamp_url, user_signature_url, background_url, draft_watermark_text, directive_watermark_text')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.warn('⚠️ AssetLoader: No assets found in database (user may not have uploaded yet)');
        this.assets = {};
        return {};
      }

      this.assets = data;
      console.log('✅ AssetLoader: Fetched fresh assets successfully');
      return data;
    } catch (error) {
      console.error('❌ AssetLoader: Failed to fetch assets:', error);
      this.assets = {};
      return {};
    }
  }

  /**
   * Get specific asset URL with optional fallback
   * @param {string} assetType - Type: 'logo', 'stamp', 'signature', 'background'
   * @param {string} fallbackUrl - Optional fallback URL if asset not found
   * @returns {string|null} - Asset URL or fallback
   */
  getAssetUrl(assetType, fallbackUrl = null) {
    if (!this.assets) {
      this.loadFromSession();
    }

    const assetMap = {
      'logo': 'company_logo_url',
      'stamp': 'company_stamp_url',
      'signature': 'user_signature_url',
      'background': 'background_url'
    };

    const fieldName = assetMap[assetType];
    if (!fieldName) {
      console.warn(`⚠️ AssetLoader: Invalid asset type "${assetType}"`);
      return fallbackUrl;
    }

    const url = this.assets?.[fieldName] || fallbackUrl;

    if (!url) {
      console.warn(`⚠️ AssetLoader: No URL found for ${assetType}`);
    }

    return url;
  }

  /**
   * Get watermark text
   * @param {string} type - Type: 'draft' or 'directive'
   * @returns {string} - Watermark text
   */
  getWatermarkText(type) {
    if (!this.assets) {
      this.loadFromSession();
    }

    if (type === 'draft') {
      return this.assets?.draft_watermark_text || 'טיוטה בלבד';
    } else if (type === 'directive') {
      return this.assets?.directive_watermark_text || 'לתיקון';
    }

    return '';
  }

  /**
   * Inject assets into HTML document
   * Replaces hardcoded image URLs with user-specific assets
   * @param {Document} document - DOM document to inject into
   * @returns {number} - Number of images updated
   */
  injectAssets(document) {
    if (!this.assets) {
      this.loadFromSession();
    }

    console.log('🔧 AssetLoader: Injecting assets into document...');
    let injectedCount = 0;

    // Debug: Log all images in document to understand why they're not being found
    const allImages = document.querySelectorAll('img');
    console.log(`🔍 AssetLoader: Found ${allImages.length} total images in document`);
    if (allImages.length < 10) { // Only log details if reasonable number
      allImages.forEach((img, index) => {
        console.log(`  Image ${index + 1}: alt="${img.alt}", data-asset-type="${img.dataset?.assetType}", src="${img.src?.substring(0, 50)}..."`);
      });
    }

    // Update all logo images (by alt attribute - case insensitive and flexible)
    const logoImages = document.querySelectorAll('img[alt="Logo"], img[alt="logo"], img[data-asset-type="logo"]');
    console.log(`🔍 AssetLoader: Found ${logoImages.length} logo images to update`);
    logoImages.forEach(img => {
      const logoUrl = this.getAssetUrl('logo');
      if (logoUrl) {
        const oldSrc = img.src;
        // Update src first
        img.src = logoUrl;
        // 🔧 PHASE 10 FIX: Set crossOrigin AFTER changing src to avoid CORS errors on old URL
        img.crossOrigin = 'anonymous';
        img.dataset.assetInjected = 'true';
        injectedCount++;
        console.log(`🖼️  Logo updated: ${oldSrc.substring(0, 50)}... → ${logoUrl.substring(0, 50)}...`);
      } else {
        console.warn('⚠️  No logo URL available, keeping existing src');
      }
    });

    // Update all signature images (by alt attribute)
    const signatureImages = document.querySelectorAll('img[alt="חתימה"], img[data-asset-type="signature"]');
    signatureImages.forEach(img => {
      const signatureUrl = this.getAssetUrl('signature');
      if (signatureUrl) {
        const oldSrc = img.src;
        // Update src first
        img.src = signatureUrl;
        // 🔧 PHASE 10 FIX: Set crossOrigin AFTER changing src to avoid CORS errors on old URL
        img.crossOrigin = 'anonymous';
        img.dataset.assetInjected = 'true';
        injectedCount++;
        console.log(`✍️  Signature updated: ${oldSrc.substring(0, 50)}... → ${signatureUrl.substring(0, 50)}...`);
      } else {
        console.warn('⚠️  No signature URL available, keeping existing src');
      }
    });

    // Update all stamp images (by alt attribute)
    const stampImages = document.querySelectorAll('img[alt="חותמת"], img[data-asset-type="stamp"]');
    stampImages.forEach(img => {
      const stampUrl = this.getAssetUrl('stamp');
      if (stampUrl) {
        const oldSrc = img.src;
        // Update src first
        img.src = stampUrl;
        // 🔧 PHASE 10 FIX: Set crossOrigin AFTER changing src to avoid CORS errors on old URL
        img.crossOrigin = 'anonymous';
        img.dataset.assetInjected = 'true';
        injectedCount++;
        console.log(`🏛️  Stamp updated: ${oldSrc.substring(0, 50)}... → ${stampUrl.substring(0, 50)}...`);
      } else {
        console.warn('⚠️  No stamp URL available, keeping existing src');
      }
    });

    // Update all background images (by data attribute)
    const backgroundImages = document.querySelectorAll('img[data-asset-type="background"]');
    backgroundImages.forEach(img => {
      const backgroundUrl = this.getAssetUrl('background');
      if (backgroundUrl) {
        const oldSrc = img.src;
        // Update src first
        img.src = backgroundUrl;
        // 🔧 PHASE 10 FIX: Set crossOrigin AFTER changing src to avoid CORS errors on old URL
        img.crossOrigin = 'anonymous';
        img.dataset.assetInjected = 'true';
        injectedCount++;
        console.log(`🖼️  Background updated: ${oldSrc.substring(0, 50)}... → ${backgroundUrl.substring(0, 50)}...`);
      } else {
        console.warn('⚠️  No background URL available, keeping existing src');
      }
    });

    if (injectedCount > 0) {
      console.log(`✅ AssetLoader: Successfully injected ${injectedCount} asset(s)`);
    } else {
      console.warn('⚠️ AssetLoader: No assets were injected (check if images exist with correct alt/data attributes)');
    }

    return injectedCount;
  }

  /**
   * Inject conditional watermark based on report status
   * @param {Document} document - DOM document to inject into
   * @param {string} status - Report status: 'draft', 'directive', 'final', or custom text
   * @returns {boolean} - True if watermark was injected
   */
  injectWatermark(document, status = null) {
    if (!this.assets) {
      this.loadFromSession();
    }

    // Determine watermark text based on status
    let watermarkText = '';

    if (!status || status === '' || status === 'final' || status === 'completed') {
      // No watermark for final/completed reports
      console.log('✅ AssetLoader: No watermark for final report');
      return true;
    } else if (status.toLowerCase() === 'draft' || status.toLowerCase() === 'טיוטה') {
      // Use custom draft watermark text or default
      watermarkText = this.assets?.draft_watermark_text || 'טיוטה בלבד';
      console.log('📋 AssetLoader: Injecting draft watermark:', watermarkText);
    } else if (status.toLowerCase() === 'directive' || status.toLowerCase() === 'לתיקון') {
      // Use custom directive watermark text or default
      watermarkText = this.assets?.directive_watermark_text || 'לתיקון';
      console.log('📋 AssetLoader: Injecting directive watermark:', watermarkText);
    } else {
      // Use status text as-is (custom directive text)
      watermarkText = status;
      console.log('📋 AssetLoader: Injecting custom watermark:', watermarkText);
    }

    // 🔧 PHASE 10 FIX: Use fixed positioning for watermarks
    // This ensures watermarks appear on all printed pages automatically
    if (watermarkText) {
      // Remove any existing watermarks first
      const existingWatermarks = document.querySelectorAll('.watermark-injected');
      existingWatermarks.forEach(w => w.remove());

      // Inject single watermark with fixed positioning at body level
      console.log('🔧 AssetLoader: Injecting fixed-position watermark');
      this.injectWatermarkIntoContainer(document.body, watermarkText);

      console.log('✅ AssetLoader: Watermark injected successfully');
      return true;
    }

    return false;
  }

  /**
   * Helper method to inject watermark into a specific container
   * @private
   */
  injectWatermarkIntoContainer(container, watermarkText) {
    // Create watermark element
    const watermark = document.createElement('div');
    watermark.className = 'watermark-injected draft-watermark';
    watermark.id = 'asset-loader-watermark-' + Date.now(); // Unique ID to prevent CSS conflicts
    watermark.textContent = watermarkText;
    
    // Style for fixed positioning to appear on all printed pages
    // Using !important to override any existing CSS
    watermark.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) rotate(-45deg) !important;
      font-size: ${watermarkText.length > 10 ? '5rem' : '6rem'} !important;
      color: rgba(220, 38, 38, 0.15) !important;
      font-weight: bold !important;
      pointer-events: none !important;
      z-index: 1000 !important;
      white-space: nowrap !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      width: auto !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      line-height: 1 !important;
      text-align: center !important;
    `;

    // No need to modify container positioning with fixed positioning

    // Insert watermark at the beginning of container
    container.insertBefore(watermark, container.firstChild);
    
    // 🔧 PHASE 10 FIX: Force re-apply centering after insertion to override any CSS
    // This ensures absolute centering even if other CSS tries to override
    setTimeout(() => {
      const injectedWatermark = document.getElementById(watermark.id);
      if (injectedWatermark) {
        injectedWatermark.style.top = '50%';
        injectedWatermark.style.left = '50%';
        injectedWatermark.style.transform = 'translate(-50%, -50%) rotate(-45deg)';
        console.log('✅ Watermark centering verified and enforced');
      }
    }, 100);
  }

  /**
   * Add watermark to PDF pages using jsPDF
   * @param {jsPDF} pdf - The jsPDF instance
   * @param {string} watermarkText - Text to display as watermark
   * @param {number} pageNum - Page number to add watermark to (optional, adds to current page if not specified)
   */
  static addWatermarkToPDF(pdf, watermarkText, pageNum = null) {
    if (!watermarkText) return;
    
    // Save current state
    const currentPage = pdf.internal.getCurrentPageInfo().pageNumber;
    
    // If specific page requested, switch to it
    if (pageNum) {
      pdf.setPage(pageNum);
    }
    
    // Set watermark style
    pdf.saveGraphicsState();
    pdf.setTextColor(220, 38, 38); // Red color
    pdf.setFontSize(60);
    pdf.setFont(undefined, 'bold');
    
    // Calculate center position
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    // Add rotated text
    // Note: jsPDF doesn't support text rotation directly, so we use a workaround
    pdf.text(watermarkText, centerX, centerY, {
      angle: 45,
      align: 'center',
      baseline: 'middle'
    });
    
    // Restore state
    pdf.restoreGraphicsState();
    
    // Return to original page if we switched
    if (pageNum && pageNum !== currentPage) {
      pdf.setPage(currentPage);
    }
  }

  /**
   * Convert images to data URIs for embedding in PDFs
   * This prevents CORS issues and timeout problems
   * 🔧 CRITICAL FIX: Process ALL images to prevent atob() encoding errors
   * @param {Document} document - DOM document
   * @returns {Promise<number>} - Number of images processed
   */
  async convertImagesToDataURIs(document) {
    console.log('🔄 AssetLoader: Converting images to data URIs...');

    // 🔧 CRITICAL FIX: Process ALL images, not just injected ones
    // This prevents atob() errors from malformed base64 in any image
    const images = document.querySelectorAll('img');
    let convertedCount = 0;
    let cleanedCount = 0;
    let skippedCount = 0;

    console.log(`🔍 Found ${images.length} images to process`);

    for (const img of images) {
      try {
        const src = img.src;

        // Skip images with empty src
        if (!src || src === '') {
          console.log(`⏭️ Skipping image with empty src: ${img.alt || 'unnamed'}`);
          skippedCount++;
          continue;
        }

        // 🔧 FIX: If image already has a data URI, just clean the base64 string
        if (src.startsWith('data:image')) {
          console.log(`🧹 Cleaning existing data URI: ${img.alt || 'unnamed'}`);

          // Extract and clean base64 string
          const base64Match = src.match(/^data:image\/(\w+);base64,(.+)$/);
          if (base64Match) {
            const imageType = base64Match[1];
            const base64Data = base64Match[2];

            // Check if base64 string has whitespace/newlines that would break atob()
            if (/\s/.test(base64Data)) {
              console.log(`🔧 Found whitespace in base64 string - cleaning...`);
              const cleanBase64 = base64Data.replace(/\s/g, '');
              const cleanDataURI = `data:image/${imageType};base64,${cleanBase64}`;

              // Update both property and attribute
              img.src = cleanDataURI;
              img.setAttribute('src', cleanDataURI);
              img.dataset.cleaned = 'true';
              cleanedCount++;

              console.log(`✅ Cleaned base64 string: ${img.alt || 'unnamed'} (removed ${base64Data.length - cleanBase64.length} whitespace chars)`);
            } else {
              console.log(`✓ Base64 already clean: ${img.alt || 'unnamed'}`);
              skippedCount++;
            }
          } else {
            console.warn(`⚠️ Could not parse data URI: ${img.alt || 'unnamed'}`);
            skippedCount++;
          }
          continue;
        }

        // 🔧 For URL images, convert to data URI via canvas (existing logic)
        console.log(`🖼️ Converting URL to data URI: ${img.alt || 'unnamed'}`);

        // 🔧 PHASE 10 FIX: If image doesn't have crossOrigin set, reload it with CORS enabled
        if (!img.crossOrigin || img.crossOrigin === '') {
          console.log(`🔄 Reloading image with CORS enabled: ${img.alt || 'unnamed'}`);
          const originalSrc = img.src;
          img.crossOrigin = 'anonymous';
          // Force reload by clearing and resetting src
          img.src = '';
          img.src = originalSrc;

          // Wait for reload
          if (!img.complete) {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              setTimeout(() => reject(new Error('reload timeout')), 5000);
            });
          }
        } else if (!img.complete) {
          console.log(`⏳ Waiting for image to load: ${img.alt}`);
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            setTimeout(() => reject(new Error('timeout')), 3000);
          });
        }

        // Create canvas and convert to data URI
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let dataURI = canvas.toDataURL('image/png');

        // 🔧 FIX atob ERROR: Clean base64 string by removing any whitespace/newlines
        // Some browsers add line breaks in long base64 strings which breaks atob()
        const base64Match = dataURI.match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          const cleanBase64 = base64Match[1].replace(/\s/g, '');
          dataURI = `data:image/png;base64,${cleanBase64}`;
        }

        // 🔧 CRITICAL: Set BOTH property AND attribute to ensure outerHTML captures it
        img.src = dataURI;
        img.setAttribute('src', dataURI);
        img.removeAttribute('data-asset-injected'); // Mark as converted
        img.removeAttribute('crossorigin'); // No longer needed
        img.dataset.converted = 'true';
        convertedCount++;

        console.log(`✅ Converted to data URI: ${img.alt || 'unnamed'} (length: ${dataURI.length})`);
      } catch (error) {
        console.warn(`⚠️ Failed to process image: ${img.alt ||'unnamed'}`, error);
        // Continue with other images even if one fails
        skippedCount++;
      }
    }

    console.log(`✅ Image processing complete:`);
    console.log(`   - Converted (URL → data URI): ${convertedCount}`);
    console.log(`   - Cleaned (fixed base64): ${cleanedCount}`);
    console.log(`   - Skipped (errors/empty): ${skippedCount}`);
    console.log(`   - Total processed: ${images.length}`);

    return convertedCount + cleanedCount;
  }

  /**
   * Inject assets into a cloned document (for PDF generation)
   * @param {Document} document - DOM document to inject into
   * @param {string} status - Optional report status for watermark injection
   * @returns {Promise<number>} - Number of images updated
   */
  async injectAssetsForPDF(document, status = null) {
    console.log('📄 AssetLoader: Injecting assets for PDF generation...');

    const count = this.injectAssets(document);

    // Inject watermark if status is provided
    if (status !== null) {
      this.injectWatermark(document, status);
    }

    // Wait for ALL images to actually load
    const images = document.querySelectorAll('img[data-asset-injected="true"]');
    if (images.length > 0) {
      console.log(`⏳ Waiting for ${images.length} injected images to load...`);
      const imageLoadPromises = Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) {
            console.log(`✅ Image already loaded: ${img.alt || 'unnamed'}`);
            resolve();
          } else {
            img.onload = () => {
              console.log(`✅ Image loaded: ${img.alt || 'unnamed'}`);
              resolve();
            };
            img.onerror = () => {
              console.warn(`⚠️ Image failed to load: ${img.alt || 'unnamed'}`);
              resolve(); // Still resolve to not block
            };
            // Timeout after 5 seconds
            setTimeout(() => {
              console.warn(`⏱️ Image load timeout: ${img.alt || 'unnamed'}`);
              resolve();
            }, 5000);
          }
        });
      });

      await Promise.all(imageLoadPromises);
      console.log('✅ All images loaded, ready for PDF generation');
    } else {
      // Still wait a bit for any non-injected images
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return count;
  }

  /**
   * Verify assets are loaded
   * @returns {boolean} - True if assets are available
   */
  hasAssets() {
    if (!this.assets) {
      this.loadFromSession();
    }

    return !!(
      this.assets?.company_logo_url ||
      this.assets?.company_stamp_url ||
      this.assets?.user_signature_url ||
      this.assets?.background_url
    );
  }

  /**
   * Get summary of available assets
   * @returns {object} - Summary object
   */
  getAssetsSummary() {
    if (!this.assets) {
      this.loadFromSession();
    }

    return {
      hasLogo: !!this.assets?.company_logo_url,
      hasStamp: !!this.assets?.company_stamp_url,
      hasSignature: !!this.assets?.user_signature_url,
      hasBackground: !!this.assets?.background_url,
      logoUrl: this.assets?.company_logo_url || null,
      stampUrl: this.assets?.company_stamp_url || null,
      signatureUrl: this.assets?.user_signature_url || null,
      backgroundUrl: this.assets?.background_url || null,
      draftWatermark: this.assets?.draft_watermark_text || 'טיוטה בלבד',
      directiveWatermark: this.assets?.directive_watermark_text || 'לתיקון'
    };
  }
}

// Create singleton instance
export const assetLoader = new AssetLoader();

// Make available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.assetLoader = assetLoader;
  window.AssetLoader = AssetLoader;
}

// Export default
export default assetLoader;

// =====================================================
// Usage Examples:
// =====================================================
//
// 1. Load assets from sessionStorage:
//    assetLoader.loadFromSession();
//
// 2. Inject into current page:
//    assetLoader.injectAssets(document);
//
// 3. Inject before PDF generation:
//    await assetLoader.injectAssetsForPDF(document);
//    // Then generate PDF...
//
// 4. Get specific asset URL:
//    const logoUrl = assetLoader.getAssetUrl('logo');
//
// 5. Check if user has assets:
//    if (assetLoader.hasAssets()) {
//      // User has uploaded assets
//    }
//
// 6. Get summary:
//    const summary = assetLoader.getAssetsSummary();
//    console.log('Assets:', summary);
//
// =====================================================
