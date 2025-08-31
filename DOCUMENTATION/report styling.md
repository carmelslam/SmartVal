Report pdf style:

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