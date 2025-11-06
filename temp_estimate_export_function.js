// EXPERTISE PATTERN FOR ESTIMATE EXPORT
window.exportToMake = async function(event) {
  const helper = JSON.parse(sessionStorage.getItem('helper') || '{}');
  const button = event.target;
  const originalText = button.textContent;
  
  try {
    // Show loading message
    button.textContent = '📤 מייצא...';
    button.disabled = true;
    
    // Get data from helper (EXPERTISE PATTERN)
    const caseInfo = helper.case_info || {};
    const plate = helper.estimate?.vehicle?.plateNumber || helper.vehicle?.plate_number || helper.car_details?.plate || helper.meta?.plate || '';
    const caseIdOrNumber = caseInfo.supabase_case_id || helper.meta?.case_id;
    
    // Validate case ID (EXPERTISE PATTERN)
    const { supabase } = await import('./lib/supabaseClient.js');
    let actualCaseId = caseIdOrNumber;
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidPattern.test(caseIdOrNumber)) {
      const { data: caseData, error: lookupError } = await supabase
        .from('cases')
        .select('id')
        .or(`case_number.eq.${caseIdOrNumber},plate.eq.${plate?.replace(/-/g, '')}`)
        .limit(1)
        .single();
      
      if (lookupError || !caseData) {
        throw new Error('לא נמצא תיק בשרת - נסה שוב');
      }
      actualCaseId = caseData.id;
    }
    
    // Generate PDF from HTML (EXPERTISE PATTERN)
    console.log('📄 Generating estimate PDF...');
    const cleanHTML = document.documentElement.outerHTML
      .replace(/<div class="control-buttons no-print">[\s\S]*?<\/div>/g, '')
      .replace(/<div[^>]*style="[^"]*טיוטה בלבד[^"]*"[^>]*>[\s\S]*?<\/div>/g, '')
      .replace(/טיוטה בלבד/g, '')
      .replace(/<button[\s\S]*?<\/button>/g, '')
      .replace(/<div[^>]*class="[^"]*no-print[^"]*"[^>]*>[\s\S]*?<\/div>/g, '');
    
    // Open HTML in hidden window for rendering
    const reviewWindow = window.open('', '_blank');
    if (!reviewWindow) {
      throw new Error('חסימת חלונות קופצים - אנא אפשר חלונות קופצים');
    }
    
    reviewWindow.document.write(cleanHTML);
    reviewWindow.document.close();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Use html2canvas (EXPERTISE PATTERN)
    const canvas = await html2canvas(reviewWindow.document.body, {
      scale: 1,
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      ignoreElements: (element) => {
        return element.tagName === 'IMG' && element.src.includes('carmelcayouf.com');
      }
    });
    
    // Convert canvas to PDF (EXPERTISE PATTERN)
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    const pageWidth = 210;
    const pageHeight = 297;
    const topMargin = 15;
    const bottomMargin = 15;
    const leftMargin = 10;
    const rightMargin = 10;
    const contentWidth = pageWidth - leftMargin - rightMargin;
    const contentHeight = pageHeight - topMargin - bottomMargin;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = topMargin;
    
    pdf.addImage(imgData, 'JPEG', leftMargin, position, contentWidth, imgHeight);
    heightLeft -= contentHeight;
    
    while (heightLeft > 0) {
      position = -(imgHeight - heightLeft) + topMargin;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', leftMargin, position, contentWidth, imgHeight);
      heightLeft -= contentHeight;
    }
    
    reviewWindow.close();
    const pdfBlob = pdf.output('blob');
    
    // Upload PDF to storage (EXPERTISE PATTERN)
    console.log('☁️ Uploading estimate PDF to Supabase Storage...');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const normalizedPlate = plate?.replace(/-/g, '') || 'UNKNOWN';
    const filename = `${normalizedPlate}_estimate_final_${timestamp}.pdf`;
    const storagePath = `${actualCaseId}/${filename}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('estimate-reports')
      .upload(storagePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ Storage upload error:', uploadError);
      throw new Error('Failed to upload PDF: ' + uploadError.message);
    }
    
    // Get public URL (EXPERTISE PATTERN)
    const { data: { publicUrl } } = supabase.storage
      .from('estimate-reports')
      .getPublicUrl(storagePath);
    
    console.log('✅ PDF uploaded to storage:', publicUrl);
    
    // Save to tracking table (EXPERTISE PATTERN)
    const estimateData = {
      case_id: actualCaseId,
      plate: plate?.replace(/-/g, ''),
      report_type: 'estimate',
      damage_center_count: helper.vehicleItems?.length || helper.centers?.length || 0,
      damage_center_name: helper.vehicleItems?.[0]?.center_name || helper.centers?.[0]?.name || 'כללי',
      actual_repairs: helper.vehicleItems?.map(item => item.description).join(', ') || helper.centers?.map(c => c.description).join(', ') || '',
      total_parts: helper.calculations?.total_parts || 0,
      total_work: helper.calculations?.total_work || 0,
      claim_amount: helper.calculations?.total_claim || helper.calculations?.total_amount || 0,
      depreciation: helper.calculations?.depreciation_amount || 0,
      final_compensation: helper.calculations?.final_compensation || helper.calculations?.total_amount || 0,
      notes: `אומדן ראשוני נוצר ב-${new Date().toLocaleDateString('he-IL')}`,
      damage_center_index: 0,
      pdf_public_url: publicUrl,
      timestamp: new Date().toISOString()
    };
    
    const { data: trackingData, error: trackingError } = await supabase
      .from('tracking_final_report')
      .insert([estimateData])
      .select()
      .single();
    
    if (trackingError) {
      console.error('❌ Tracking save failed:', trackingError);
      throw new Error(`שגיאה בשמירה לשרת: ${trackingError.message}`);
    }
    
    console.log('✅ Estimate saved to tracking table:', trackingData);
    
    // Send to Make.com webhook (EXPERTISE PATTERN)
    console.log('🔗 Sending estimate to עיבוד webhook...');
    const webhookResponse = await fetch('https://hook.eu2.make.com/7dvgi7patq0vlgbd53hjbjasf6tek16l', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...estimateData,
        supabase_id: trackingData.id,
        action: 'SUBMIT_ESTIMATE',
        source: 'estimate_report_builder'
      })
    });
    
    if (!webhookResponse.ok) {
      console.warn('⚠️ עיבוד webhook failed, but Supabase data saved');
    } else {
      console.log('✅ Estimate sent to עיבוד successfully');
    }
    
    alert('✅ האומדן יוצא בהצלחה');
    
  } catch (error) {
    console.error('❌ Export estimate failed:', error);
    alert(`❌ שגיאה ביצוא האומדן: ${error.message}`);
  } finally {
    // Restore button
    button.textContent = originalText;
    button.disabled = false;
  }
};