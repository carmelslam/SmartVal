/**
 * Enhanced Category Detection Logic
 * Automatically classifies invoice items as parts/works/repairs based on Hebrew content analysis
 */

class CategoryDetector {
  constructor() {
    // Enhanced Hebrew keyword patterns for each category
    this.categoryPatterns = {
      part: {
        // Direct part indicators
        direct: [
          'חלק', 'פריט', 'רכיב', 'מוצר', 'פגוש', 'דלת', 'מכסה', 'פנס', 'מראה', 
          'גלגל', 'צמיג', 'מנוע', 'תיבה', 'בלם', 'מתלה', 'רדיאטור', 'סוללה', 
          'מגן', 'זכוכית', 'שמשה', 'מגב', 'צופר', 'אנטנה', 'ידית', 'מוט',
          'מסנן', 'פילטר', 'שמן', 'נוזל', 'חיישן', 'ממסר', 'נתיך', 'חיווט',
          'כבל', 'צינור', 'צינורית', 'קפיץ', 'בורג', 'אום', 'מסמרה'
        ],
        // Part family indicators
        families: [
          'מערכת בלמים', 'מערכת קירור', 'מערכת חשמל', 'מערכת מתלים',
          'מערכת הגה', 'מערכת דלק', 'מערכת אוורור', 'מערכת תאורה'
        ],
        // Brand/manufacturer indicators
        brands: [
          'בוש', 'דנסו', 'דלפי', 'מגנטי מארלי', 'סקף', 'פירלי',
          'ברמבו', 'זקס', 'שקלטון', 'לוק', 'ויברו'
        ],
        // Exclusion patterns (if these appear, likely NOT a part)
        exclusions: [
          'התקנה', 'הרכבה', 'פירוק', 'עבודה', 'שירות', 'תיקון', 'ריתוך', 'צביעה'
        ]
      },
      
      work: {
        // Direct work indicators
        direct: [
          'עבודה', 'התקנה', 'הרכבה', 'פירוק', 'ניתוק', 'חיבור', 'ריתוך',
          'צביעה', 'ליטוש', 'כיוון', 'בדיקה', 'אבחון', 'שירות', 'תחזוקה',
          'ניקוי', 'שטיפה', 'יישור', 'כיול', 'הדבקה', 'איטום', 'מילוי',
          'החלפה', 'הסרה', 'הוצאה', 'הכנסה', 'שיוף', 'קידוח'
        ],
        // Work type indicators  
        types: [
          'שעות עבודה', 'עבודת יד', 'מלאכה', 'התקנת', 'פירוק של',
          'תיקון של', 'בדיקת', 'אבחון של', 'כיוון של', 'יישור של'
        ],
        // Time/labor indicators
        labor: [
          'שעה', 'שעות', 'דקות', 'זמן עבודה', 'עבודת טכנאי', 'עבודת מומחה',
          'שכר עבודה', 'עלות עבודה', 'תעריף'
        ]
      },
      
      repair: {
        // Direct repair indicators
        direct: [
          'תיקון', 'שיפוץ', 'שיקום', 'חידוש', 'הלחמה', 'הדבקה', 'איטום',
          'מילוי', 'החלקה', 'ליטוש', 'הקשחה', 'חיזוק', 'ייצוב', 'ריפוד',
          'תפירה', 'הידוק', 'חידוד', 'ישור'
        ],
        // Repair type indicators
        types: [
          'תיקון מקומי', 'תיקון חלקי', 'שיקום מלא', 'חידוש פנים',
          'תיקון נזק', 'שיפוץ כללי', 'חידוש חלק'
        ],
        // Material indicators for repairs
        materials: [
          'מסטיק', 'דבק', 'סיליקון', 'פוליאסטר', 'פלסטיק',
          'גומי', 'עור', 'בד', 'קצף'
        ]
      }
    };

    // Context-based scoring weights
    this.weights = {
      direct_match: 10,      // Direct keyword match
      family_match: 8,       // Part family match
      brand_match: 6,        // Brand/manufacturer match
      type_match: 7,         // Work/repair type match
      labor_match: 9,        // Labor/time indicator
      material_match: 5,     // Material indicator
      exclusion_penalty: -15 // Penalty for exclusion matches
    };

    // Confidence thresholds
    this.confidenceThresholds = {
      high: 80,
      medium: 60,
      low: 40
    };
  }

  /**
   * Detect category for a single item with confidence scoring
   * @param {Object} item - Item to classify
   * @param {string} item.description - Item description in Hebrew
   * @param {string} item.name - Item name in Hebrew
   * @param {string} item.code - Item code
   * @returns {Object} Classification result with category and confidence
   */
  detectCategory(item) {
    const text = `${item.description || ''} ${item.name || ''} ${item.code || ''}`.toLowerCase();
    
    if (!text.trim()) {
      return {
        category: 'uncategorized',
        confidence: 0,
        confidence_level: 'low',
        method: 'hebrew_pattern_analysis',
        reasoning: 'No text content to analyze'
      };
    }

    // Calculate scores for each category
    const scores = {
      part: this.calculateCategoryScore(text, 'part'),
      work: this.calculateCategoryScore(text, 'work'),
      repair: this.calculateCategoryScore(text, 'repair')
    };

    // Find best category
    const bestCategory = Object.keys(scores).reduce((a, b) => 
      scores[a].total > scores[b].total ? a : b
    );

    const bestScore = scores[bestCategory];
    const confidence = Math.min(95, Math.max(0, bestScore.total));
    
    // Determine confidence level
    let confidenceLevel = 'low';
    if (confidence >= this.confidenceThresholds.high) {
      confidenceLevel = 'high';
    } else if (confidence >= this.confidenceThresholds.medium) {
      confidenceLevel = 'medium';
    }

    return {
      category: bestScore.total > this.confidenceThresholds.low ? bestCategory : 'uncategorized',
      confidence: confidence,
      confidence_level: confidenceLevel,
      method: 'hebrew_pattern_analysis',
      reasoning: bestScore.reasoning,
      all_scores: scores
    };
  }

  /**
   * Calculate weighted score for a category
   */
  calculateCategoryScore(text, category) {
    const patterns = this.categoryPatterns[category];
    let totalScore = 0;
    const matchedPatterns = [];

    // Check direct patterns
    if (patterns.direct) {
      for (const pattern of patterns.direct) {
        if (text.includes(pattern)) {
          totalScore += this.weights.direct_match;
          matchedPatterns.push(`direct:${pattern}`);
        }
      }
    }

    // Check family patterns (parts only)
    if (patterns.families) {
      for (const pattern of patterns.families) {
        if (text.includes(pattern)) {
          totalScore += this.weights.family_match;
          matchedPatterns.push(`family:${pattern}`);
        }
      }
    }

    // Check brand patterns (parts only)
    if (patterns.brands) {
      for (const pattern of patterns.brands) {
        if (text.includes(pattern)) {
          totalScore += this.weights.brand_match;
          matchedPatterns.push(`brand:${pattern}`);
        }
      }
    }

    // Check type patterns
    if (patterns.types) {
      for (const pattern of patterns.types) {
        if (text.includes(pattern)) {
          totalScore += this.weights.type_match;
          matchedPatterns.push(`type:${pattern}`);
        }
      }
    }

    // Check labor patterns (works only)
    if (patterns.labor) {
      for (const pattern of patterns.labor) {
        if (text.includes(pattern)) {
          totalScore += this.weights.labor_match;
          matchedPatterns.push(`labor:${pattern}`);
        }
      }
    }

    // Check material patterns (repairs only)
    if (patterns.materials) {
      for (const pattern of patterns.materials) {
        if (text.includes(pattern)) {
          totalScore += this.weights.material_match;
          matchedPatterns.push(`material:${pattern}`);
        }
      }
    }

    // Apply exclusion penalties (parts only)
    if (patterns.exclusions) {
      for (const pattern of patterns.exclusions) {
        if (text.includes(pattern)) {
          totalScore += this.weights.exclusion_penalty;
          matchedPatterns.push(`exclusion:${pattern}`);
        }
      }
    }

    return {
      total: totalScore,
      matches: matchedPatterns,
      reasoning: matchedPatterns.length > 0 
        ? `Matched patterns: ${matchedPatterns.join(', ')}`
        : 'No relevant patterns found'
    };
  }

  /**
   * Batch classify multiple items
   * @param {Array} items - Array of items to classify
   * @returns {Array} Array of classification results
   */
  classifyBatch(items) {
    return items.map(item => ({
      ...item,
      classification: this.detectCategory(item)
    }));
  }

  /**
   * Get classification statistics for a batch
   * @param {Array} classifications - Array of classification results
   * @returns {Object} Statistics summary
   */
  getClassificationStats(classifications) {
    const stats = {
      total: classifications.length,
      by_category: {},
      by_confidence: {},
      average_confidence: 0
    };

    let totalConfidence = 0;

    classifications.forEach(item => {
      const category = item.classification.category;
      const confidenceLevel = item.classification.confidence_level;
      
      // Count by category
      stats.by_category[category] = (stats.by_category[category] || 0) + 1;
      
      // Count by confidence level
      stats.by_confidence[confidenceLevel] = (stats.by_confidence[confidenceLevel] || 0) + 1;
      
      totalConfidence += item.classification.confidence;
    });

    stats.average_confidence = stats.total > 0 ? totalConfidence / stats.total : 0;

    return stats;
  }

  /**
   * Update category patterns based on user feedback
   * @param {string} text - Item text that was corrected
   * @param {string} correctCategory - The correct category
   * @param {string} incorrectCategory - The incorrectly predicted category
   */
  learnFromFeedback(text, correctCategory, incorrectCategory) {
    // Extract keywords from the text for learning
    const words = text.toLowerCase().split(/\s+/).filter(word => word.length > 2);
    
    console.log(`📚 Learning: "${text}" should be ${correctCategory}, not ${incorrectCategory}`);
    console.log(`🔍 Extracted keywords:`, words);
    
    // This could be enhanced to actually update patterns
    // For now, just log for manual pattern improvement
  }
}

// Export for use in other modules
window.CategoryDetector = CategoryDetector;

// Usage example:
// const detector = new CategoryDetector();
// const result = detector.detectCategory({
//   description: 'פגוש קדמי טויוטה קורולה',
//   name: 'פגוש קדמי',
//   code: '52119-12345'
// });
// console.log('Category:', result.category, 'Confidence:', result.confidence);