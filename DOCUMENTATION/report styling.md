Report pdf style:

Claude's instructions :
TASK: Fix PDF generation styling issues in final-report-template-builder.html
PROBLEM: The PDF report has content overlapping with the header/footer background image, and tables/boxes split ugly across pages.
SOLUTION: Replace ONLY the two <style> blocks in the <head> section. Do NOT modify any HTML, JavaScript, or Handlebars templates.
FIND these two style blocks:

The first style block starting with @import url('https://fonts.googleapis.com/css2?family=Heebo...
The second style block containing the body, h1, h2, h3, table styles

REPLACE them with this fixed CSS:
css<style>
  /* Modern Professional PDF Styling - FIXED */
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
  
  /* CRITICAL FIX: Reserve space for header/footer */
  @page { 
    size: A4; 
    margin: 42mm 12mm 30mm 12mm; /* top right bottom left */
  }
  
  html, body {
    margin: 0;
    padding: 0;
    direction: rtl;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-weight: 400;
    line-height: 1.6;
    color: #2c3e50;
    background: white;
  }
  
  .bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1;
    pointer-events: none;
  }
  
  .page {
    position: relative;
    z-index: 1;
    padding: 10mm;
    box-sizing: border-box;
  }
</style>
Then add the second style block with pagination fixes:
css<style>
  /* [Insert the full second style block from the artifact above - it's too long to paste here but includes all the table, heading, and print styles] */
</style>
KEY CHANGES MADE:

Changed @page { margin: 0 } to @page { margin: 42mm 12mm 30mm 12mm } to reserve space for header/footer
Removed padding: 30mm 15mm 25mm 15mm from .page class (was causing overlap)
Added border-collapse: separate to tables for clean breaks
Added break-inside: avoid to all content boxes
Added thead { display: table-header-group } to repeat table headers on new pages

DO NOT CHANGE:

Any HTML structure
Any JavaScript code
Any Handlebars templates ({{...}})
The template id="template-html" section
Any of the dynamic content generation

IMPORTANT: This is a CSS-only fix. The JavaScript report generation will continue working exactly as before.


Full html styling :

<!-- 
INSTRUCTIONS: Replace ONLY the two <style> blocks in your <head> with these fixed versions.
Keep all your HTML, JavaScript, and Handlebars templates exactly as they are.
-->

<style>
  /* Modern Professional PDF Styling - FIXED */
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
  
  /* CRITICAL FIX: Reserve space for header/footer */
  @page { 
    size: A4; 
    margin: 42mm 12mm 30mm 12mm; /* top right bottom left - adjust based on your bg image */
  }
  
  /* Base styles */
  html, body {
    margin: 0;
    padding: 0;
    direction: rtl;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-weight: 400;
    line-height: 1.6;
    color: #2c3e50;
    background: white;
  }
  
  /* Background positioning - stays behind everything */
  .bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: -1; /* Behind everything */
    pointer-events: none;
  }
  
  /* Main content container - no more fake padding */
  .page {
    position: relative;
    z-index: 1;
    padding: 10mm; /* Just normal content padding */
    box-sizing: border-box;
  }
</style>

<style>
  /* Your existing styles - ENHANCED for better pagination */
  body {
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    direction: rtl;
    margin: 0;
    padding: 0;
    font-weight: 400;
  }
  
  h1, h2, h3 {
    color: #1e3a8a;
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    font-weight: 600;
    page-break-after: avoid; /* Keep with content */
  }
  
  h1 {
    font-size: 28px;
    font-weight: 700;
    text-align: center;
    margin: 20px 0 25px 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    letter-spacing: -0.5px;
  }
  
  h2 {
    font-size: 20px;
    font-weight: 600;
    margin: 25px 0 15px 0;
    border-right: 4px solid #3b82f6;
    padding-right: 12px;
  }
  
  /* Tables with clean breaks */
  table {
    width: 100%;
    max-width: 100%;
    border-collapse: separate; /* Important for clean borders */
    border-spacing: 0;
    margin-bottom: 20px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    page-break-inside: auto; /* Allow breaking if needed */
  }
  
  table + table {
    margin-top: 10px;
  }
  
  /* Table headers repeat on new pages */
  thead {
    display: table-header-group;
  }
  
  tfoot {
    display: table-footer-group;
  }
  
  /* Keep rows together */
  tr {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  th, td {
    padding: 16px 12px;
    text-align: right;
    word-wrap: break-word;
    overflow-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
  }
  
  th {
    color: #1e3a8a !important;
    background: #fff8e1 !important;
    border-bottom: 3px solid #003366 !important;
    text-align: center !important;
  }
  
  td {
    background: rgba(255, 255, 255, 0.95);
    border-bottom: 1px solid #f1f5f9;
    transition: background-color 0.2s ease;
  }
  
  tr:nth-child(even) td {
    background: rgba(248, 250, 252, 0.95);
  }
  
  tr:hover td {
    background: rgba(224, 242, 254, 0.95);
  }
  
  /* Ensure first row after break has clean top border */
  tbody tr:first-child td {
    border-top: 2px solid #003366;
  }
  
  /* Keep content boxes together */
  .text-box,
  .legal-texts,
  .credentials-box,
  .car-details,
  .section,
  .signature-stamp {
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .text-box {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  }
  
  .legal-texts {
    background: #f5f5f5;
    border: 2px solid #d1d5db;
    border-radius: 8px;
    padding: 20px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  
  .legal-separator {
    border-bottom: 2px solid #333;
    width: 100%;
    margin: 15px 0;
    height: 0;
  }
  
  /* Control Buttons Styling */
  .control-btn {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    color: white;
  }
  
  .control-btn:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    transform: translateY(-1px);
  }
  
  .edit-btn { background: linear-gradient(135deg, #ffc107 0%, #fd7e14 100%); }
  .preview-btn { background: linear-gradient(135deg, #6f42c1 0%, #e83e8c 100%); }
  .submit-btn { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); }
  .home-btn { background: linear-gradient(135deg, #6c757d 0%, #495057 100%); }
  
  .credentials-box {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 20px;
    margin: 40px 0 15px 0;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  /* Print-specific optimizations */
  @media print {
    /* Hide non-print elements */
    .action-buttons,
    .control-buttons,
    .no-print,
    button,
    .control-btn {
      display: none !important;
    }
    
    /* Also hide any watermark elements */
    div[style*="טיוטה בלבד"] {
      display: none !important;
    }
    
    /* Ensure colors print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Font size adjustments for print */
    html, body {
      font-size: 11px !important;
      line-height: 1.3 !important;
    }
    
    /* Background stays fixed on every page */
    .bg {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 210mm !important;
      height: 297mm !important;
      z-index: -1 !important;
    }
    
    /* Content respects page margins */
    .page {
      width: 100% !important;
      margin: 0 !important;
      padding: 8mm !important;
      box-sizing: border-box !important;
      position: relative !important;
      z-index: 1 !important;
    }
    
    /* Table optimizations */
    table {
      page-break-inside: auto !important;
      margin-bottom: 4mm !important;
      font-size: 10px !important;
    }
    
    th, td {
      padding: 3mm !important;
      font-size: 9px !important;
    }
    
    /* Repeat table headers on each page */
    thead {
      display: table-header-group !important;
    }
    
    /* Keep important sections together */
    .text-box,
    .credentials-box,
    .car-details {
      page-break-inside: avoid !important;
      margin: 8mm 0 2mm 0 !important;
      padding: 15px !important;
      background: rgba(255, 255, 255, 0.98) !important;
    }
    
    /* Legal text formatting */
    #dynamic-legal-text {
      line-height: 1.1 !important;
      font-size: 14px !important;
      margin-bottom: 8px !important;
    }
    
    /* Signature areas */
    .signature-stamp {
      margin: 10px 0 !important;
      padding: 15px !important;
      page-break-inside: avoid !important;
    }
    
    .signature-stamp img,
    img[alt="חתימה"] {
      height: 120px !important;
      margin: 10px 0 !important;
    }
    
    /* Headings stay with content */
    h1, h2, h3 {
      page-break-after: avoid !important;
      margin-bottom: 3mm !important;
      font-size: 14px !important;
    }
    
    /* Prevent orphaned list items */
    li {
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    
    /* Force page breaks where specified */
    .page-break,
    div[style*="page-break-before: always"],
    div[style*="page-break-after: always"] {
      page-break-before: always !important;
      break-before: page !important;
    }
  }
  
  /* Section spacing */
  .section {
    margin-bottom: 20px;
    page-break-inside: avoid;
  }
  
  .section:not(:first-child) {
    margin-top: 15px;
  }
  
  .signature-stamp {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    border: 1px solid #e2e8f0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .signature-stamp img {
    height: 120px;
    filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
  }
  
  .signature-stamp .center-text {
    flex-grow: 1;
    text-align: center;
    font-size: 20px;
    font-weight: 700;
    color: #1e3a8a;
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .car-details {
    background: white;
    border: 2px solid #3b82f6;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 8px 25px rgba(59, 130, 246, 0.1);
    transition: all 0.3s ease;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  .car-details-title {
    color: #1e3a8a;
    font-weight: 700;
    font-size: 22px;
    text-align: center;
    margin-bottom: 20px;
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    letter-spacing: -0.3px;
  }
  
  .car-details-table {
    width: 100%;
    border: none;
    font-size: 16px;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  }
  
  .car-details-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-weight: 500;
    text-align: center !important;
  }
  
  .car-info-table td {
    text-align: right !important;
  }
  
  .car-details-table tr:nth-child(even) td {
    background: #f8fafc;
  }
  
  .car-details-table tr:hover td {
    background: #e0f2fe;
  }
  
  .intellectual-box {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border: 2px solid #3b82f6;
    border-radius: 12px;
    padding: 20px;
    font-size: 16px;
    font-weight: 600;
    margin: 20px 0;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
    font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    color: #1e3a8a;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  
  /* Additional pagination helpers */
  .keep-together {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
  
  .avoid-break {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
</style>




Chatgpt instructions: 


The pdf styling task is : 
	1.	the background header/footer never gets covered
	2.	content never sits under them
	3.	tables/boxes don’t split ugly across pages, and if they must split, the new page starts clean (closed borders / repeated headers).

Here’s a drop-in recipe that works with Chromium/Gotenberg.

1) Reserve real page margins (safe area)

Instead of padding tricks, use @page margins. Content can’t enter these areas, but your fixed background can.

<head>
<meta charset="utf-8">
<style>
  /* A4 with “safe” top/bottom for your artwork */
  @page { size: A4; margin: 42mm 12mm 30mm; } /* top right/left bottom */

  /* Print fidelity */
  html,body{margin:0; direction:rtl; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  @media print{
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Background header+footer on every page */
  .bg{ position: fixed; inset: 0; width: 100%; height: 100%;
       object-fit: cover; z-index: 0; pointer-events: none; }

  /* Foreground content sits above background */
  .page { position: relative; z-index: 1; }

  /* --- Pagination hygiene --- */

  /* Don’t split these blocks across pages */
  .card, .section, .figure { break-inside: avoid; page-break-inside: avoid; }

  /* Tables: keep rows intact; repeat header on new pages */
  table { width:100%; border-collapse: separate; border-spacing:0; border:1px solid #9db6d3; border-radius:12px; overflow:hidden; }
  thead { display: table-header-group; }   /* repeats per page */
  tfoot { display: table-footer-group; }   /* optional */
  tr, thead, tbody { break-inside: avoid; page-break-inside: avoid; }
  th, td { padding: 6px 10px; border-bottom: 1px solid #d6e2f0; }
  tbody tr:last-child td { border-bottom: 0; }

  /* If a long table must split, start the new page clean: */
  thead th { border-bottom: 2px solid #9db6d3; }     /* gives a “closed top” on each new page */
  /* Optional visual frame per section to avoid “cut” look */
  .box { border:1px solid #9db6d3; border-radius:12px; padding:10mm; break-inside: avoid; page-break-inside: avoid; margin: 6mm 0; }

  /* Force a new page before big sections if you like */
  .page-break { break-before: page; page-break-before: always; }
</style>
</head>
<body>
  <!-- Full-page background appears on every page, including @page margins -->
  <img class="bg" src="http://157.90.125.220:8080/assets/bg-report.png" alt="">

  <!-- All content sits in the safe area defined by @page margins -->
  <div class="page">

    <!-- Example: a boxed section that won’t be split -->
    <div class="box">
      <!-- your header block -->
    </div>

    <!-- Example: a table that can span pages but stays neat -->
    <table dir="rtl">
      <thead>
        <tr><th>כותרת</th><th>פרטים</th><th>עלות</th></tr>
      </thead>
      <tbody>
        <!-- many rows … each row won’t split -->
      </tbody>
    </table>

    <!-- Optional manual breaks for logical sections -->
    <div class="page-break"></div>

  </div>
</body>

Why this fixes your screenshots:
	•	The header/footer art lives in the page margins (@page margin) while your content is confined to the “safe” area—so it can’t overlap them.
	•	position: fixed background repeats on every page in Chromium, so your header/footer appear consistently.
	•	thead { display: table-header-group } repeats the table header on each new page and, with a top border on thead th, the new page looks “closed” (no half-border).
	•	break-inside: avoid on .card, .box, tr keeps rows/blocks from splitting across pages.
	•	Rounded frames (border-radius on table/box) plus repeated thead make page transitions look intentional.

2) Practical sizing

Adjust the @page numbers to match your artwork height:
	•	If your header graphic is ~40 mm tall, set top margin ≈ 40–45mm.
	•	If your footer is ~28 mm, set bottom margin ≈ 28–32mm.
	•	Side margins: keep 10–15mm for breathing room and printer non-printable areas.

3) Tips for tricky cases
	•	Very long single cell/paragraph: browsers can still split it. Wrap that content in a .box and, if necessary, insert a <div class="page-break"></div> right before it starts.
	•	Borders cut mid-page: prefer a single outer border on the table/box, not per-row borders; let only border-bottom on cells provide grid lines.
	•	Watermark: if it’s in the background PNG, you’re good. If it’s an overlay element, make it position: fixed; z-index:0 (under content).

you already have two <style> blocks inside <head>, plus a lot of print CSS at the bottom. That’s why your content sometimes overlaps with the header/footer background and why tables break ugly.

Here’s how to integrate my “safe margins + clean table break” fix into your existing file:

⸻

✅ Step 1: Adjust @page to reserve space for header/footer

Right now you have:

@page { size: A4; margin: 0; }

Replace it with (set margins equal to the graphic heights you need to keep clear):

@page {
  size: A4;
  margin: 42mm 12mm 30mm; /* top right/left bottom */
}

That way, the content area starts below your header art and ends above your footer art.

⸻

✅ Step 2: Background (already correct)

You already have:

<img class="bg" src="https://assets.carmelcayouf.com/assets/bg-report.png" alt="">

Leave it as-is. It will render behind everything. The reserved margins ensure text doesn’t cover it.

⸻

✅ Step 3: Update .page CSS

You currently have:

.page { position:relative; z-index:1; padding: 30mm 15mm 25mm 15mm; }

You don’t need to hard-pad for header/footer anymore, because @page handles it. Change it to:

.page {
  position: relative;
  z-index: 1;
  padding: 12mm;   /* just inner padding, not to fight with header/footer */
  box-sizing: border-box;
}


⸻

✅ Step 4: Fix table pagination

Add this block to your CSS (at the end of <style>):

/* Keep rows/boxes intact across pages */
.section, .text-box, .credentials-box, .car-details, tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* Repeat table header on every page */
thead { display: table-header-group; }
tfoot { display: table-footer-group; }

/* Give thead a strong bottom border so each new page looks “closed” */
thead th {
  border-bottom: 2px solid #003366 !important;
}


⸻

✅ Step 5: Remove duplicates

You already have some page-break-inside: avoid rules in your second <style> block. Merge my additions with them so you don’t get conflicting rules.

⸻

📍 Where exactly to paste
	1.	In <head>:
	•	Replace the existing @page and .page definitions.
	•	Add my table rules at the end of your big <style> block.
	2.	In <body>: nothing changes, since you already have <img class="bg"> and <div class="page">.
———

The suggested fix :
Keep all dynamic content and report properties as is , do not break the page just fix the styling : 

<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <style>
    /* Modern Professional PDF Styling */
    @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
    
    /* ✅ Reserve header/footer space */
    @page { 
      size: A4; 
      margin: 42mm 12mm 30mm; /* top right/left bottom */
    }

    body {
      margin: 0;
      direction: rtl;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-weight: 400;
      line-height: 1.6;
      color: #2c3e50;
      background: white;
    }

    .bg {
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
      pointer-events: none;
    }

    /* ✅ No more fake padding for header/footer */
    .page {
      position: relative;
      z-index: 1;
      padding: 12mm;
      box-sizing: border-box;
    }
  </style>

  <style>
    /* Headings */
    h1, h2, h3 {
      color: #1e3a8a;
      font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
      font-weight: 600;
    }
    h1 {
      font-size: 28px;
      font-weight: 700;
      text-align: center;
      margin: 20px 0 25px 0;
      text-shadow: 0 2px 4px rgba(0,0,0,0.1);
      letter-spacing: -0.5px;
    }
    h2 {
      font-size: 20px;
      font-weight: 600;
      margin: 25px 0 15px 0;
      border-right: 4px solid #3b82f6;
      padding-right: 12px;
    }

    /* Tables */
    table {
      width: 100%;
      max-width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      font-family: 'Heebo', 'Segoe UI', Tahoma, Arial, sans-serif;
    }
    table + table { margin-top: 10px; }
    th, td {
      padding: 16px 12px;
      text-align: right;
      word-wrap: break-word;
      overflow-wrap: break-word;
      font-size: 14px;
      line-height: 1.4;
    }
    th {
      color: #1e3a8a !important;
      background: #fff8e1 !important;
      border-bottom: 3px solid #003366 !important;
      text-align: center !important;
    }
    td {
      background: rgba(255, 255, 255, 0.95);
      border-bottom: 1px solid #f1f5f9;
    }
    tr:nth-child(even) td { background: rgba(248, 250, 252, 0.95); }

    /* Boxes */
    .text-box,
    .legal-texts,
    .credentials-box,
    .car-details {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    /* ✅ Pagination hygiene */
    .section, .text-box, .credentials-box, .car-details, tr {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
    thead th { border-bottom: 2px solid #003366 !important; }

    /* Force page breaks when needed */
    .page-break { break-before: page; page-break-before: always; }

    /* Print adjustments */
    @media print {
      body { font-size: 11px; line-height: 1.3; }
      th, td { padding: 3mm !important; font-size: 9px !important; }
      h1, h2, h3 {
        page-break-after: avoid !important;
        margin-bottom: 3mm !important;
        font-size: 14px !important;
      }

      .bg {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 210mm !important;
        height: 297mm !important;
        z-index: 0 !important;
      }

      .page {
        width: 210mm !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        position: relative !important;
        z-index: 1 !important;
      }

      .action-buttons,
      .control-buttons,
      .no-print,
      button,
      .control-btn {
        display: none !important;
      }
    }
  </style>

  <script src="https://cdn.jsdelivr.net/npm/handlebars@latest/dist/handlebars.min.js"></script>
  <script src="./math-preview.js"></script>
</head>

<body>
  <!-- Background -->
  <img class="bg" src="https://assets.carmelcayouf.com/assets/bg-report.png" alt="">
  
  <!-- Content -->
  <div class="page">
    <div id="report-output"></div>

    <!-- ⬇ keep all your <template id="template-html"> ... existing report content ⬇ -->
    <!-- (I didn’t touch your Handlebars template, signatures, or buttons) -->
  </div>
</body>
</html>