// Pending Images Management
// Location: pending-images.js

import { supabase, getCurrentUser } from './lib/supabaseClient.js';

// State variables
let pendingImages = [];
let currentIndex = 0;
let selectedCaseId = null;
let selectedCaseName = null;
let selectedDamageCenter = null;
let currentUser = null;
let allUserCases = [];

// Make.com webhook URL for processing accepted images
// TODO: Replace with your actual webhook URL from Make.com Scenario C
const WEBHOOK_PROCESS_IMAGE = 'https://hook.us1.make.com/YOUR-WEBHOOK-ID-HERE';

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Pending Images page loaded');
  await init();
});

async function init() {
  try {
    // Get current user
    currentUser = await getCurrentUser();
    
    if (!currentUser) {
      alert('משתמש לא מחובר');
      window.location.href = 'selection.html';
      return;
    }

    console.log('✅ User authenticated:', currentUser.id);

    // Load user's cases for dropdown
    await loadUserCases();

    // Load pending images
    await loadPendingImages();

    // Setup real-time subscription for new images
    setupRealtimeSubscription();

    // Setup case search functionality
    setupCaseSearch();

  } catch (error) {
    console.error('❌ Initialization error:', error);
    showToast('שגיאה בטעינת המערכת', 'error');
  }
}

// Load all user's cases for dropdown
async function loadUserCases() {
  try {
    console.log('📋 Loading user cases...');

    // Get user's profile to find their cases
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('user_id', currentUser.id)
      .single();

    if (profileError) throw profileError;

    // Query cases based on user role
    let query = supabase
      .from('cases')
      .select('id, plate_number, case_status, damage_center, created_at, owner_name');

    // If not admin, filter by assessor
    if (profile.role !== 'admin') {
      query = query.eq('assessor_id', currentUser.id);
    }

    const { data, error } = await query
      .order('case_status', { ascending: true }) // Open cases first
      .order('created_at', { ascending: false });

    if (error) throw error;

    allUserCases = data || [];
    console.log(`✅ Loaded ${allUserCases.length} cases for user`);

  } catch (error) {
    console.error('❌ Error loading cases:', error);
    showToast('שגיאה בטעינת תיקים', 'error');
    allUserCases = [];
  }
}

// Load pending images for current user
async function loadPendingImages() {
  document.getElementById('loading-state').style.display = 'block';
  document.getElementById('review-interface').style.display = 'none';
  document.getElementById('empty-state').style.display = 'none';
  
  try {
    console.log('📸 Loading pending images for user:', currentUser.id);

    const { data, error } = await supabase
      .from('pending_images')
      .select('*')
      .eq('assigned_to_user', currentUser.id)
      .eq('status', 'pending')
      .order('received_at', { ascending: false });

    if (error) throw error;

    pendingImages = data || [];
    console.log(`✅ Loaded ${pendingImages.length} pending images`);

    document.getElementById('loading-state').style.display = 'none';

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      showReviewInterface();
      displayCurrentImage();
    }

  } catch (error) {
    console.error('❌ Error loading pending images:', error);
    showToast('שגיאה בטעינת תמונות', 'error');
    document.getElementById('loading-state').style.display = 'none';
    showEmptyState();
  }
}

// Show empty state
function showEmptyState() {
  document.getElementById('empty-state').style.display = 'block';
  document.getElementById('review-interface').style.display = 'none';
}

// Show review interface
function showReviewInterface() {
  document.getElementById('empty-state').style.display = 'none';
  document.getElementById('review-interface').style.display = 'block';
}

// Display current image
function displayCurrentImage() {
  if (currentIndex >= pendingImages.length) {
    // All done
    showEmptyState();
    return;
  }

  const image = pendingImages[currentIndex];
  console.log('🖼️ Displaying image:', currentIndex + 1, 'of', pendingImages.length);

  // Update progress
  document.getElementById('progress-text').textContent = 
    `תמונה ${currentIndex + 1} מתוך ${pendingImages.length}`;
  const progressPercent = ((currentIndex + 1) / pendingImages.length) * 100;
  document.getElementById('progress-fill').style.width = `${progressPercent}%`;

  // Display image
  const imageUrl = image.thumbnail_url || image.temp_storage_url;
  document.getElementById('current-image').src = imageUrl;
  
  // Source badge
  const sourceBadge = document.getElementById('source-badge');
  if (image.source === 'whatsapp') {
    sourceBadge.textContent = '📱 WhatsApp';
    sourceBadge.className = 'source-badge badge-whatsapp';
  } else {
    sourceBadge.textContent = '📧 אימייל';
    sourceBadge.className = 'source-badge badge-email';
  }

  // Metadata
  document.getElementById('filename').textContent = image.original_filename;
  document.getElementById('received-time').textContent = formatRelativeTime(image.received_at);

  // Email-specific info
  if (image.source === 'email') {
    const metadata = image.source_metadata || {};
    
    document.getElementById('email-info').style.display = 'block';
    document.getElementById('sender').textContent = metadata.sender || 'לא ידוע';

    // Plate info
    if (image.suggested_plate_number) {
      document.getElementById('plate-info').style.display = 'block';
      document.getElementById('detected-plate').textContent = image.suggested_plate_number;
    } else {
      document.getElementById('plate-info').style.display = 'none';
    }

    // Auto-match
    if (image.suggested_case_id && image.auto_match_confidence === 'high') {
      document.getElementById('auto-match-notice').style.display = 'block';
      preselectCase(image.suggested_case_id);
    } else {
      document.getElementById('auto-match-notice').style.display = 'none';
    }
  } else {
    document.getElementById('email-info').style.display = 'none';
    document.getElementById('plate-info').style.display = 'none';
    document.getElementById('auto-match-notice').style.display = 'none';
  }

  // Button states
  document.getElementById('btn-prev').disabled = (currentIndex === 0);
  updateAcceptButton();
}

// Preselect a case (for auto-match)
function preselectCase(caseId) {
  const matchedCase = allUserCases.find(c => c.id === caseId);
  if (matchedCase) {
    selectCase(matchedCase.id, matchedCase.plate_number, matchedCase.damage_center);
  }
}

// Format relative time in Hebrew
function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'עכשיו';
  if (diffMins < 60) return `לפני ${diffMins} דקות`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `לפני ${diffDays} ימים`;
}

// Setup case search
function setupCaseSearch() {
  const searchInput = document.getElementById('case-search');
  const resultsDiv = document.getElementById('case-results');

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();

    if (query.length === 0) {
      resultsDiv.style.display = 'none';
      return;
    }

    // Filter cases
    const filtered = allUserCases.filter(c => 
      c.plate_number.includes(query) ||
      (c.owner_name && c.owner_name.includes(query)) ||
      c.id.includes(query)
    ).slice(0, 10); // Limit to 10 results

    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div class="case-item">לא נמצאו תיקים</div>';
      resultsDiv.style.display = 'block';
      return;
    }

    // Display results
    resultsDiv.innerHTML = filtered.map(c => {
      const isOpen = c.case_status === 'OPEN' || c.case_status === 'open';
      const statusClass = isOpen ? 'case-open' : '';
      const statusLabel = isOpen ? 'פתוח' : 'סגור';
      
      return `
        <div class="case-item ${statusClass}" onclick="selectCaseFromDropdown('${c.id}', '${c.plate_number}', '${c.damage_center || ''}')">
          <div class="case-details">
            <div class="case-plate">${c.plate_number}</div>
            <div class="case-meta">
              ${c.owner_name || 'ללא שם'} • ${c.damage_center || 'ללא מרכז'}
            </div>
          </div>
          <span class="case-status ${isOpen ? 'status-open' : ''}">${statusLabel}</span>
        </div>
      `;
    }).join('');

    resultsDiv.style.display = 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-box')) {
      resultsDiv.style.display = 'none';
    }
  });
}

// Select case from dropdown (called via onclick)
window.selectCaseFromDropdown = function(caseId, plateName, damageCenter) {
  selectCase(caseId, plateName, damageCenter);
};

// Select a case
function selectCase(caseId, plateName, damageCenter) {
  selectedCaseId = caseId;
  selectedCaseName = plateName;
  selectedDamageCenter = damageCenter || 'לא צוין';

  console.log('✅ Case selected:', caseId, plateName);

  // Show selected
  document.getElementById('selected-case').style.display = 'flex';
  document.getElementById('selected-case-name').textContent = 
    `${plateName} - ${selectedDamageCenter}`;
  
  // Hide dropdown
  document.getElementById('case-results').style.display = 'none';
  document.getElementById('case-search').value = '';

  // Enable accept button
  updateAcceptButton();
}

// Clear selection
window.clearSelection = function() {
  selectedCaseId = null;
  selectedCaseName = null;
  selectedDamageCenter = null;
  document.getElementById('selected-case').style.display = 'none';
  updateAcceptButton();
};

// Update accept button state
function updateAcceptButton() {
  const acceptBtn = document.getElementById('btn-accept');
  const batchBtn = document.getElementById('btn-batch');
  
  if (selectedCaseId) {
    acceptBtn.disabled = false;
    batchBtn.disabled = false;
  } else {
    acceptBtn.disabled = true;
    batchBtn.disabled = true;
  }
}

// Navigate to previous image
window.previousImage = function() {
  if (currentIndex > 0) {
    currentIndex--;
    clearSelection();
    displayCurrentImage();
  }
};

// Accept current image
window.acceptImage = async function() {
  if (!selectedCaseId) {
    showToast('נא לבחור תיק', 'warning');
    return;
  }

  const image = pendingImages[currentIndex];
  const acceptBtn = document.getElementById('btn-accept');
  const originalText = acceptBtn.textContent;
  
  acceptBtn.disabled = true;
  acceptBtn.textContent = 'מעבד...';

  try {
    console.log('✅ Accepting image:', image.id, 'to case:', selectedCaseId);

    // Update database
    const { error: updateError } = await supabase
      .from('pending_images')
      .update({
        status: 'accepted',
        final_case_id: selectedCaseId,
        final_damage_center: selectedDamageCenter,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (updateError) throw updateError;

    // Call Make.com webhook to process image
    console.log('📞 Calling processing webhook...');
    
    const webhookResponse = await fetch(WEBHOOK_PROCESS_IMAGE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pending_image_id: image.id,
        final_case_id: selectedCaseId,
        final_damage_center: selectedDamageCenter,
        user_id: currentUser.id
      })
    });

    if (!webhookResponse.ok) {
      console.warn('⚠️ Webhook failed, but image marked as accepted');
    }

    showToast('תמונה אושרה בהצלחה', 'success');

    // Remove from array and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      // Stay at same index (which now shows next image)
      if (currentIndex >= pendingImages.length) {
        currentIndex = pendingImages.length - 1;
      }
      displayCurrentImage();
    }

  } catch (error) {
    console.error('❌ Error accepting image:', error);
    showToast('שגיאה באישור תמונה', 'error');
    acceptBtn.textContent = originalText;
    acceptBtn.disabled = false;
  }
};

// Deny current image
window.denyImage = async function() {
  const reasons = [
    'איכות תמונה גרועה',
    'תמונה לא רלוונטית',
    'תיק שגוי',
    'כפילות',
    'אחר'
  ];
  
  const reasonIndex = prompt(
    'בחר סיבת דחייה:\n\n' +
    reasons.map((r, i) => `${i + 1}. ${r}`).join('\n') +
    '\n\nהזן מספר (1-5):'
  );
  
  if (!reasonIndex) return; // Cancelled
  
  const reason = reasons[parseInt(reasonIndex) - 1] || reasons[4];
  const image = pendingImages[currentIndex];

  try {
    console.log('⊘ Denying image:', image.id, 'reason:', reason);

    const { error } = await supabase
      .from('pending_images')
      .update({
        status: 'denied',
        denial_reason: reason,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (error) throw error;

    showToast('תמונה נדחתה', 'info');

    // Remove and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      if (currentIndex >= pendingImages.length) {
        currentIndex = pendingImages.length - 1;
      }
      displayCurrentImage();
    }

  } catch (error) {
    console.error('❌ Error denying image:', error);
    showToast('שגיאה בדחיית תמונה', 'error');
  }
};

// Delete current image
window.deleteImage = async function() {
  if (!confirm('למחוק תמונה זו לצמיתות?')) return;

  const image = pendingImages[currentIndex];

  try {
    console.log('❌ Deleting image:', image.id);

    const { error } = await supabase
      .from('pending_images')
      .update({
        status: 'deleted',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', image.id);

    if (error) throw error;

    showToast('תמונה נמחקה', 'info');

    // Remove and move to next
    pendingImages.splice(currentIndex, 1);
    clearSelection();

    if (pendingImages.length === 0) {
      showEmptyState();
    } else {
      if (currentIndex >= pendingImages.length) {
        currentIndex = pendingImages.length - 1;
      }
      displayCurrentImage();
    }

  } catch (error) {
    console.error('❌ Error deleting image:', error);
    showToast('שגיאה במחיקת תמונה', 'error');
  }
};

// Batch accept all to same case
window.batchAcceptAll = async function() {
  if (!selectedCaseId) {
    showToast('נא לבחור תיק', 'warning');
    return;
  }

  const count = pendingImages.length;
  if (!confirm(`לאשר את כל ${count} התמונות לתיק ${selectedCaseName}?`)) {
    return;
  }

  const batchBtn = document.getElementById('btn-batch');
  const originalText = batchBtn.textContent;
  batchBtn.disabled = true;
  batchBtn.textContent = `מעבד 0/${count}...`;

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < pendingImages.length; i++) {
    const image = pendingImages[i];
    
    try {
      // Update status
      const { error: updateError } = await supabase
        .from('pending_images')
        .update({
          status: 'accepted',
          final_case_id: selectedCaseId,
          final_damage_center: selectedDamageCenter,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', image.id);

      if (updateError) throw updateError;

      // Trigger webhook
      await fetch(WEBHOOK_PROCESS_IMAGE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pending_image_id: image.id,
          final_case_id: selectedCaseId,
          final_damage_center: selectedDamageCenter,
          user_id: currentUser.id
        })
      });

      successCount++;
      batchBtn.textContent = `מעבד ${successCount}/${count}...`;
      
    } catch (error) {
      console.error(`❌ Failed to process image ${image.id}:`, error);
      failCount++;
    }
  }

  showToast(
    `אושרו ${successCount} תמונות בהצלחה${failCount > 0 ? `, ${failCount} נכשלו` : ''}`, 
    successCount > 0 ? 'success' : 'error'
  );

  // Reload
  pendingImages = [];
  currentIndex = 0;
  clearSelection();
  await loadPendingImages();
};

// Expand image to lightbox
window.expandImage = function() {
  const image = pendingImages[currentIndex];
  document.getElementById('lightbox-image').src = image.temp_storage_url;
  document.getElementById('image-lightbox').style.display = 'flex';
};

// Close lightbox
window.closeLightbox = function() {
  document.getElementById('image-lightbox').style.display = 'none';
};

// Real-time subscription for new images
function setupRealtimeSubscription() {
  console.log('📡 Setting up real-time subscription...');

  supabase
    .channel('pending-images-realtime')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'pending_images',
      filter: `assigned_to_user=eq.${currentUser.id}`
    }, (payload) => {
      console.log('🔔 New pending image received:', payload.new);
      
      // Add to array
      pendingImages.push(payload.new);
      
      // Show toast
      const source = payload.new.source === 'email' ? 'אימייל' : 'WhatsApp';
      showToast(`תמונה חדשה התקבלה מ-${source}`, 'info');
      
      // If was empty, refresh display
      if (pendingImages.length === 1) {
        showReviewInterface();
        displayCurrentImage();
      }
    })
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
    });
}

// Toast notification system
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Export for console access (debugging)
window.pendingImagesDebug = {
  pendingImages,
  currentIndex,
  currentUser,
  allUserCases
};
