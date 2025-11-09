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
        hasSignature: !!this.assets.user_signature_url
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
        .select('company_logo_url, company_stamp_url, user_signature_url, draft_watermark_text, directive_watermark_text')
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

    // Update all logo images (by alt attribute)
    const logoImages = document.querySelectorAll('img[alt="Logo"], img[data-asset-type="logo"]');
    logoImages.forEach(img => {
      const logoUrl = this.getAssetUrl('logo');
      if (logoUrl) {
        const oldSrc = img.src;
        img.src = logoUrl;
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
        img.src = signatureUrl;
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
        img.src = stampUrl;
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
        img.src = backgroundUrl;
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

    const watermarkElement = document.querySelector('.watermark, .draft-watermark');
    if (!watermarkElement) {
      console.warn('⚠️ AssetLoader: No watermark element found in document');
      return false;
    }

    // Determine watermark text based on status
    let watermarkText = '';

    if (!status || status === '' || status === 'final' || status === 'completed') {
      // Hide watermark for final/completed reports
      watermarkElement.style.display = 'none';
      console.log('✅ AssetLoader: Watermark hidden for final report');
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

    // Apply watermark text
    if (watermarkText) {
      watermarkElement.textContent = watermarkText;
      watermarkElement.style.display = '';

      // Dynamic font sizing based on text length
      const textLength = watermarkText.length;
      if (textLength > 20) {
        watermarkElement.style.fontSize = '5rem';
      } else if (textLength > 15) {
        watermarkElement.style.fontSize = '6rem';
      } else if (textLength > 10) {
        watermarkElement.style.fontSize = '7rem';
      } else {
        watermarkElement.style.fontSize = '8rem';
      }

      console.log('✅ AssetLoader: Watermark injected successfully');
      return true;
    }

    return false;
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

    // Wait a bit for images to start loading
    await new Promise(resolve => setTimeout(resolve, 300));

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
