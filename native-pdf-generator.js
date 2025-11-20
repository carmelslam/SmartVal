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
      if (window.supabase && window.supabase.auth) {
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

      // 🔧 Fix CORS issues for images
      if (window.ImageCorsFix) {
        console.log('🔧 Fixing CORS issues before PDF generation...');
        await window.ImageCorsFix.fixImagesForPDF(reviewWindow.document);
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

        /* ✅ FIX FONT HIERARCHY: Balanced font sizes - larger text, smaller tables */
        * {
          font-size: 12px !important; /* Increased from 8px for readability */
        }

        h1 {
          font-size: 22px !important; /* Increased from 14px - main titles */
        }

        h2 {
          font-size: 18px !important; /* Increased from 12px - subtitles */
        }

        h3, h4, h5, h6 {
          font-size: 14px !important; /* Increased from 10px - section headers */
        }

        p, div, span, li {
          font-size: 12px !important; /* Increased from 8px - body text */
        }

        /* Tables: Keep text readable but reduce cell padding */
        table {
          font-size: 11px !important; /* Slightly smaller than body for compact tables */
        }

        td, th {
          font-size: 11px !important;
          padding: 3px 5px !important; /* Reduced padding for compact tables */
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
          opacity: 0.08 !important; /* Subtle but visible */
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
  }
};

console.log('✅ Native PDF Generator loaded');
