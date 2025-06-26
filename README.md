# EvalSystem

This repository contains the internal portal used by Yaron Cayuf's team for car damage assessment and report generation. It is a single page web application written mostly in vanilla JavaScript and HTML. Access to this repository is restricted and the code is not intended for public distribution.

## Overview

The system guides an operator through a full workflow:

1. Open a new case and collect basic vehicle details.
2. Document damage centers, required repairs, and replacement parts.
3. Upload images and invoices.
4. Calculate depreciation and other fees.
5. Generate estimate drafts and final legal reports.
6. Manage credentials and override settings via the admin panel.

All information is stored locally in `sessionStorage` and pushed to Make.com webhooks for further processing (PDF creation, OCR, etc.).

## Important Files

- `index.html` – starting point of the portal and home of the router.
- `router.js` – registers modules and orchestrates page transitions.
- `helper.js` – central store that tracks all metadata and vehicle information.
- `webhook.js` – defines the webhook endpoints used throughout the app.
- `admin.js` – developer control panel for VAT rates, text vault editing, and override flags.
- `credentials vault.md` – internal list of third‑party logins used by the embedded browser.
- `legal texts logic .md` – explains the structure of text blocks for the various report types.

## Running Locally

Serve the project with any static web server and open `index.html` in a modern browser. For example:

```bash
# Using Python
python3 -m http.server 8000
```

Then navigate to `http://localhost:8000/index.html`.

The portal relies on external webhooks, so make sure network access to Make.com is available.

## Directory Structure

```
├── *.html               # UI pages used by the router
├── *.js                 # Modular logic (damage centers, parts search, report generator, …)
├── styles.css           # Shared styling
├── credentials vault.md # Stored third‑party credentials (private)
└── legal texts logic.md # Details about report text placeholders
```

## Security Notice

This repository is private and should remain within the organization. Keep the credentials file confidential and do not expose webhook URLs publicly. Any forks or external distribution are prohibited.

© Carmel Cayouf. All rights reserved. Any unauthorized use of this code is forbidden.

