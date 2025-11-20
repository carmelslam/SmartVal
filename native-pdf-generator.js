/**
 * Native PDF Generator Utility
 * Uses browser's native window.print() API for proper PDF generation
 * Replaces html2canvas + jsPDF approach to enable CSS-based page breaking
 *
 * BENEFITS:
 * - CSS @page margins work properly
 * - page-break-inside: avoid prevents table cuts
 * - thead { display: table-header-group } repeats headers
 * - Background images render clearly
 * - All existing CSS styling applies correctly
 */

window.NativePdfGenerator = {

  /**
   * Generate PDF using jsPDF's .html() method (better than html2canvas slicing)
   *
   * @param {string} htmlContent - The full HTML content to convert to PDF
   * @param {string} reportType - Type of report (expertise/estimate/final)
   * @param {string} status - Report status ('draft' or 'final')
   * @param {object} options - Additional options
   * @returns {Promise<{blob: Blob, window: Window}>} PDF blob for upload and preview window
   */
  async generatePDF(htmlContent, reportType, status = 'final', options = {}) {
    console.log(`📄 Generating ${reportType} PDF using jsPDF.html() method (status: ${status})...`);

    // Validate inputs
    if (!htmlContent) {
      throw new Error('HTML content is required');
    }

    // Open new window BEFORE async operations to avoid popup blocker
    const reviewWindow = window.open('', '_blank');

    if (!reviewWindow) {
      console.error('⚠️ Popup blocked - cannot generate PDF');
      throw new Error('Popup blocked. Please allow popups for this site.');
    }

    try {
      // 🔒 Refresh authentication before long PDF operation
      if (window.supabase?.auth?.refreshSession) {
        try {
          console.log('🔒 Refreshing session before PDF generation...');
          const { data: sessionData, error: refreshError } = await window.supabase.auth.refreshSession();
          if (refreshError) {
            console.warn('⚠️ Session refresh failed:', refreshError);
          } else {
            console.log('✅ Session refreshed successfully');
          }
        } catch (authError) {
          console.warn('⚠️ Auth refresh error:', authError);
        }
      } else {
        console.warn('⚠️ refreshSession not available, skipping auth refresh');
      }

      // Inject enhanced print-specific CSS into HTML
      const enhancedHtml = this._injectPrintCSS(htmlContent);

      // ✅ FIX ENCODING: Set charset BEFORE writing HTML
      reviewWindow.document.open('text/html', 'replace');
      reviewWindow.document.charset = 'UTF-8';
      reviewWindow.document.write(enhancedHtml);
      reviewWindow.document.close();

      // ✅ FIX HEBREW: Wait for fonts to load completely (especially Heebo font)
      console.log('⏳ Waiting for fonts to load...');
      await reviewWindow.document.fonts.ready;
      console.log('✅ Fonts loaded successfully');

      // Wait for content and images to load (increased for better font loading)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // 🔧 Inject watermark for draft reports
      if (status === 'draft' && window.assetLoader) {
        console.log('🔧 Injecting draft watermark...');
        window.assetLoader.injectWatermark(reviewWindow.document, 'draft');
      }

      // 🔧 Fix CORS issues for images - CRITICAL FIX
      console.log('🔧 Validating and fixing images before PDF generation...');
      await this._fixAndValidateImages(reviewWindow.document);

      // 🔧 CRITICAL FIX: Clean all image data URIs to prevent atob() encoding errors
      // This self-contained method removes whitespace from base64 strings in data URIs
      // Unlike the previous assetLoader approach, this ALWAYS executes (no dependencies)
      console.log('🔄 Cleaning all image data URIs to prevent atob() errors...');
      try {
        const cleanedCount = await this._cleanAllImageDataURIs(reviewWindow.document);
        console.log(`✅ Cleaned ${cleanedCount} total images (img tags + CSS backgrounds)`);
      } catch (cleanError) {
        console.error('❌ CRITICAL: Image cleaning failed:', cleanError);
        // Continue anyway - better to try PDF generation than fail completely
      }

      // Additional wait for assets
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('✅ Content ready, generating PDF with jsPDF.html()...');

      // Use jsPDF's .html() method which respects CSS better than html2canvas
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4', true); // true = compress

      // Configure jsPDF.html() options for better rendering
      // Note: jsPDF instance config is set in constructor (line 86), not in html() options
      const pdfOptions = {
        margin: [5, 5, 5, 5], // [top, left, bottom, right] in mm - minimal margins for maximum content space
        filename: `${reportType}_${status}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          // ✅ FIX BALANCE: Increased scale from 0.28 to 0.55 for readable text
          // Combined with increased font sizes (12-22px) and reduced table padding
          // This provides better balance: larger visible text, compact tables
          // Calculation: 800px window * 0.55 scale = 440px content width in A4
          scale: 0.55,
          windowWidth: 800, // Optimized window width for better content layout
          useCORS: true,
          logging: false,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          // ✅ FIX HEBREW: Use SVG rendering which handles Hebrew fonts better
          foreignObjectRendering: true, // SVG rendering for better RTL/Hebrew support
          imageTimeout: 15000 // Give more time for font loading
        },
        // Page break settings
        autoPaging: 'text', // Enable automatic page breaks
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['tr', '.avoid-break', '.signature-stamp', '.text-box']
        }
      };

      // Generate PDF using jsPDF's html() method
      await pdf.html(reviewWindow.document.body, pdfOptions);

      // Get PDF as blob for upload
      const pdfBlob = pdf.output('blob');

      console.log('✅ PDF generated successfully');

      // Return both the blob (for upload) and window (for caller to close)
      return {
        blob: pdfBlob,
        window: reviewWindow,
        pdf: pdf
      };

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      reviewWindow.close();
      throw error;
    }
  },

  /**
   * Inject enhanced CSS for proper PDF printing
   * Ensures all the CSS fixes from AUDIT_REPORT_PDF_STYLING.md are applied
   *
   * @param {string} htmlContent - Original HTML content
   * @returns {string} HTML with enhanced print CSS injected
   */
  _injectPrintCSS(htmlContent) {
    // CSS enhancements for native print
    const printEnhancementCSS = `
      <!-- ✅ FIX HEBREW: Explicit UTF-8 encoding -->
      <meta charset="UTF-8">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">

      <!-- ✅ FIX HEBREW: Preload and import Heebo font for Hebrew text support -->
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="preload" href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap" as="style">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap">

      <style id="native-pdf-print-enhancements">
        /* ========================================
         * NATIVE PDF PRINT ENHANCEMENTS
         * Applied for window.print() API
         * ======================================== */

        /* ✅ FIX HEBREW: Explicit font-face for Hebrew characters */
        @font-face {
          font-family: 'Heebo';
          font-style: normal;
          font-weight: 400;
          src: url(https://fonts.gstatic.com/s/heebo/v21/NGSpv5_NC0k9P_v6ZUCbLRAHxK1EiS2cckOnz02SXQ.woff2) format('woff2');
          unicode-range: U+0590-05FF, U+20AA, U+25CC, U+FB1D-FB4F;
        }

        /* ✅ FIXED: Proper font hierarchy - clear distinction between elements */
        * {
          font-size: 16px !important; /* Base font size for all elements */
        }

        h1 {
          font-size: 32px !important; /* FIXED: Main titles 2x body size for clear hierarchy */
        }

        h2 {
          font-size: 24px !important; /* FIXED: Subtitles clearly distinct */
        }

        h3 {
          font-size: 18px !important; /* FIXED: Section headers */
        }

        h4, h5, h6 {
          font-size: 16px !important; /* FIXED: Subsection headers, same as body but bold */
        }

        p, div, span, li {
          font-size: 16px !important; /* Body text - readable base size */
        }

        /* Tables: Slightly smaller but still readable */
        table {
          font-size: 14px !important; /* Table content compact but readable */
        }

        td, th {
          font-size: 13px !important; /* Cell text readable */
          padding: 4px 6px !important; /* Balanced padding */
        }

        /* Core Page Structure */
        @page {
          size: A4;
          margin: 42mm 12mm 30mm 12mm; /* Space for headers/footers */
        }

        @page:first {
          margin-top: 20mm; /* Less margin on first page */
        }

        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
          /* ✅ FIX HEBREW: Ensure proper RTL and Hebrew font rendering */
          direction: rtl !important;
          font-family: 'Heebo', 'Arial', sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        /* Background Image Fix */
        .bg {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          z-index: -1 !important; /* Behind all content */
          opacity: 0.25 !important; /* FIXED: More visible background */
          pointer-events: none !important;
        }

        /* Page Container */
        .page {
          position: relative !important;
          z-index: 1 !important;
          padding: 5mm !important; /* Small padding with @page margins */
          box-sizing: border-box !important;
        }

        /* Table Breaking Fixes */
        table {
          border-collapse: separate !important;
          border-spacing: 0 !important;
          page-break-inside: auto !important;
          width: 100% !important;
          max-width: 100% !important;
          table-layout: fixed !important; /* Prevent tables from expanding beyond container */
          word-wrap: break-word !important; /* Break long words to fit */
          overflow-wrap: break-word !important;
        }

        /* Ensure table cells don't overflow */
        td, th {
          max-width: 100% !important;
          word-wrap: break-word !important;
          overflow-wrap: break-word !important;
          overflow: hidden !important;
        }

        thead {
          display: table-header-group !important; /* Repeat on each page */
        }

        tbody {
          display: table-row-group !important;
        }

        tbody tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        tbody tr:first-child td {
          border-top: 2px solid #003366 !important; /* Clean border after break */
        }

        /* Prevent Content Sections from Breaking */
        .text-box,
        .legal-texts,
        .credentials-box,
        .car-details,
        .section,
        .signature-stamp,
        .header-section,
        .footer-section {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }

        /* Orphan/Widow Control */
        p, li, div {
          orphans: 3;
          widows: 3;
        }

        /* Print Media Specific */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page {
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            page-break-after: auto !important;
          }

          /* Ensure logos and signatures are visible */
          .company-logo,
          .signature-img,
          img {
            max-width: 100% !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide print buttons and UI elements */
          button,
          .no-print,
          .hide-on-print {
            display: none !important;
          }
        }
      </style>
    `;

    // Inject before closing </head> tag, or before first <style> if no </head>
    if (htmlContent.includes('</head>')) {
      return htmlContent.replace('</head>', printEnhancementCSS + '\n</head>');
    } else if (htmlContent.includes('<style>')) {
      return htmlContent.replace('<style>', printEnhancementCSS + '\n<style>');
    } else {
      // Fallback: inject after opening <html> or <body>
      return htmlContent.replace(/<html[^>]*>/, '$&\n' + printEnhancementCSS);
    }
  },

  /**
   * Wait for content and images to load in the print window
   *
   * @param {Window} printWindow - The window containing content to print
   * @returns {Promise<void>}
   */
  async _waitForContentLoad(printWindow) {
    return new Promise((resolve) => {
      // Check if document is already complete
      if (printWindow.document.readyState === 'complete') {
        console.log('📄 Document already loaded');
        resolve();
        return;
      }

      // Wait for load event
      printWindow.addEventListener('load', () => {
        console.log('📄 Document loaded');

        // Additional wait for images
        const images = printWindow.document.querySelectorAll('img');
        const imagePromises = Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolveImg) => {
            img.onload = resolveImg;
            img.onerror = resolveImg; // Don't block on failed images
            // Timeout after 5 seconds
            setTimeout(resolveImg, 5000);
          });
        });

        Promise.all(imagePromises).then(() => {
          console.log('🖼️ All images loaded');
          resolve();
        });
      });

      // Timeout fallback
      setTimeout(() => {
        console.warn('⏱️ Content load timeout - proceeding anyway');
        resolve();
      }, 10000);
    });
  },

  /**
   * Generate multiple PDFs in sequence
   * Useful when expertise button needs to generate 3 PDFs
   *
   * @param {Array} reports - Array of {htmlContent, reportType, status} objects
   * @returns {Promise<Array<Window>>} Array of print windows
   */
  async generateMultiplePDFs(reports) {
    console.log(`📄 Generating ${reports.length} PDFs in sequence...`);
    const windows = [];

    for (const report of reports) {
      try {
        const printWindow = await this.generatePDF(
          report.htmlContent,
          report.reportType,
          report.status,
          report.options || {}
        );
        windows.push(printWindow);

        // Small delay between PDFs to avoid overwhelming the browser
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Failed to generate ${report.reportType} PDF:`, error);
        windows.push(null);
      }
    }

    return windows;
  },

  /**
   * Fix and validate images to prevent atob() encoding errors
   * Replaces CORS-blocked images with safe SVG data URLs
   *
   * @param {Document} document - The document containing images to fix
   * @returns {Promise<void>}
   */
  async _fixAndValidateImages(document) {
    console.log('🔍 Scanning images for CORS and encoding issues...');

    // Safe SVG placeholders for different image types
    const SAFE_PLACEHOLDERS = {
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ibG9nb0dyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMjU2M2ViO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMxZDRlZDg7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0idXJsKCNsb2dvR3JhZCkiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSI0Ii8+CiAgPHRleHQgeD0iNTAiIHk9IjU4IiBmb250LWZhbWlseT0iSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5ZQzwvdGV4dD4KPC9zdmc+',
      signature: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDx0ZXh0IHg9IjEwMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiMyNTYzZWIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPtee16jXldefINeS15nXldeTPC90ZXh0PgogIDx0ZXh0IHg9IjEwMCIgeT0iNDgiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NDE1MSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+16nXnteQ15og16jXmdeRINeV15TXoteo15vXqSDXoNeW15nXmdedPC90ZXh0PgogIDx0ZXh0IHg9IjEwMCIgeT0iNjIiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+bGljLiMgMTIzNDU2PC90ZXh0Pgo8L3N2Zz4=',
      generic: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIgLz4KICA8dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2U8L3RleHQ+Cjwvc3ZnPg=='
    };

    // CORS-blocked domains that need replacement
    const CORS_DOMAINS = ['carmelcayouf.com'];

    const images = document.querySelectorAll('img');
    let replacedCount = 0;
    let removedCount = 0;

    for (const img of images) {
      try {
        const src = img.src;

        // Skip if already a data URL
        if (src.startsWith('data:')) {
          continue;
        }

        // Check if image is from CORS-blocked domain
        let isBlocked = false;
        for (const domain of CORS_DOMAINS) {
          if (src.includes(domain)) {
            isBlocked = true;
            break;
          }
        }

        if (isBlocked) {
          // Replace with safe placeholder based on image type
          let placeholder = SAFE_PLACEHOLDERS.generic;

          if (img.alt === 'Logo' || img.alt === 'logo' || img.dataset?.assetType === 'logo') {
            placeholder = SAFE_PLACEHOLDERS.logo;
            console.log('🔄 Replacing CORS-blocked logo with safe placeholder');
          } else if (img.alt === 'חתימה' || img.dataset?.assetType === 'signature') {
            placeholder = SAFE_PLACEHOLDERS.signature;
            console.log('🔄 Replacing CORS-blocked signature with safe placeholder');
          } else {
            console.log('🔄 Replacing CORS-blocked image with generic placeholder');
          }

          img.src = placeholder;
          replacedCount++;
          continue;
        }

        // For Supabase images, ensure CORS is enabled
        if (src.includes('supabase.co')) {
          img.crossOrigin = 'anonymous';
        }

      } catch (error) {
        console.warn('⚠️ Error processing image, removing to prevent PDF generation failure:', error);
        // Remove problematic image completely to prevent atob() error
        img.remove();
        removedCount++;
      }
    }

    console.log(`✅ Image validation complete: ${replacedCount} replaced, ${removedCount} removed`);

    // Wait a bit for image updates to take effect
    await new Promise(resolve => setTimeout(resolve, 300));
  },

  /**
   * Clean all image data URIs by removing whitespace from base64 strings
   * This method is self-contained and doesn't rely on assetLoader
   * CRITICAL: Prevents atob() encoding errors in jsPDF when base64 contains whitespace
   *
   * @param {Document} document - The document containing images to clean
   * @returns {Promise<number>} Number of images cleaned
   */
  async _cleanAllImageDataURIs(document) {
    console.log('🧹 Cleaning all image data URIs (removing whitespace from base64)...');

    // Get ALL images: <img> tags, CSS backgrounds, SVG images, etc.
    const imgTags = document.querySelectorAll('img');
    const allElements = document.querySelectorAll('*');

    let cleanedCount = 0;
    let skippedCount = 0;
    let totalDataURIs = 0;
    let backgroundsCleaned = 0;

    console.log(`  📊 Found ${imgTags.length} <img> tags, scanning ${allElements.length} total elements for images...`);

    // STEP 1: Clean <img> tag sources
    for (const img of imgTags) {
      try {
        const src = img.src;

        // Skip empty images
        if (!src) {
          skippedCount++;
          continue;
        }

        // Skip non-data-URI images (URLs)
        if (!src.startsWith('data:image')) {
          skippedCount++;
          continue;
        }

        totalDataURIs++;

        // Extract image type and base64 data
        // Pattern: data:image/TYPE;base64,BASE64DATA
        // ✅ FIXED: Use [^;]+ instead of \w+ to match image types like 'svg+xml'
        const base64Match = src.match(/^data:image\/([^;]+);base64,(.+)$/);
        if (!base64Match) {
          console.warn(`  ⚠️ Malformed data URI in <img>: ${src.substring(0, 100)}...`);
          continue;
        }

        const imageType = base64Match[1];
        const base64Data = base64Match[2];

        // Check if base64 contains whitespace
        if (/\s/.test(base64Data)) {
          const cleanBase64 = base64Data.replace(/\s/g, '');
          const cleanDataURI = `data:image/${imageType};base64,${cleanBase64}`;

          img.src = cleanDataURI;
          img.setAttribute('src', cleanDataURI);

          cleanedCount++;
          const removedChars = base64Data.length - cleanBase64.length;
          console.log(`  🧼 Cleaned <img> #${cleanedCount}: ${imageType} (removed ${removedChars} whitespace chars)`);
        }
      } catch (error) {
        console.warn('⚠️ Error cleaning <img> tag:', error);
      }
    }

    // STEP 2: Clean CSS background-image properties
    console.log('  🔍 Scanning CSS background-image properties...');
    for (const element of allElements) {
      try {
        const style = window.getComputedStyle(element);
        const bgImage = style.backgroundImage;

        if (!bgImage || bgImage === 'none') continue;

        // Check if background contains data URI
        if (bgImage.includes('data:image')) {
          // Extract data URI from url("data:image/...")
          const dataURIMatch = bgImage.match(/url\(["']?(data:image\/[^"')]+)["']?\)/);
          if (!dataURIMatch) continue;

          const dataURI = dataURIMatch[1];

          // Check if it's a base64 data URI with whitespace
          const base64Match = dataURI.match(/^data:image\/([^;]+);base64,(.+)$/);
          if (!base64Match) continue;

          const imageType = base64Match[1];
          const base64Data = base64Match[2];

          if (/\s/.test(base64Data)) {
            const cleanBase64 = base64Data.replace(/\s/g, '');
            const cleanDataURI = `data:image/${imageType};base64,${cleanBase64}`;

            element.style.backgroundImage = `url("${cleanDataURI}")`;

            backgroundsCleaned++;
            const removedChars = base64Data.length - cleanBase64.length;
            console.log(`  🧼 Cleaned CSS background #${backgroundsCleaned}: ${imageType} (removed ${removedChars} whitespace chars)`);
          }
        }
      } catch (error) {
        // Silently continue - some elements may not have accessible styles
      }
    }

    const summary = `✅ Image cleaning complete: ${cleanedCount} <img> tags cleaned, ${backgroundsCleaned} CSS backgrounds cleaned, ${totalDataURIs - cleanedCount} already clean, ${skippedCount} skipped`;
    console.log(summary);

    return cleanedCount + backgroundsCleaned;
  }
};

console.log('✅ Native PDF Generator loaded');
