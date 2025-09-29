// hebrew-text-normalizer.js - Client-side Hebrew text processing
// Handles corrupted Hebrew text and provides search normalization

class HebrewTextNormalizer {
  constructor() {
    // Hebrew character mappings for REVERSED text (the real issue!)
    this.reversedHebrewMappings = {
      // Reversed Hebrew words to correct Hebrew
      'סנפ': 'פנס',        // headlight
      'ףנכ': 'כנף',        // wing  
      'תותיא': 'איתות',     // signals
      'הארמ': 'מראה',       // mirror
      'תלד': 'דלת',         // door
      'שוגפ': 'פגוש',       // bumper
      'לאמש': 'שמאל',       // left
      'נימי': 'ימין',       // right
      'ימדק': 'קדמי',       // front
      'ירוחא': 'אחורי',     // rear
      'הטויוט': 'טויוטה',   // Toyota
      'חותפ': 'פתוח',       // open
      'רוגס': 'סגור',       // closed
      // Abbreviated sides
      '\'מש': 'שמ\'',       // left abbreviation
      '\'מי': 'ים\'',       // right abbreviation
      '\'דק': 'קד\'',       // front abbreviation
      '\'חא': 'אח\'',       // rear abbreviation
    };
    
    // Part name mappings (Hebrew <-> English)
    this.partMappings = {
      'פנס': ['light', 'headlight', 'lamp', 'פנס', 'פנסים'],
      'כנף': ['wing', 'panel', 'fender', 'כנף', 'כנפים'],
      'דלת': ['door', 'דלת', 'דלתות'],
      'מראה': ['mirror', 'מראה', 'מראות'],
      'פגוש': ['bumper', 'פגוש', 'פגושים'],
      'שמאל': ['left', 'L', 'LH', 'שמאל', 'ש'],
      'ימין': ['right', 'R', 'RH', 'ימין', 'י'],
      'קדמי': ['front', 'F', 'FH', 'קדמי', 'ק'],
      'אחורי': ['rear', 'R', 'RH', 'אחורי', 'א'],
      'איתות': ['signal', 'indicator', 'turn', 'איתות'],
      'גבוה': ['high', 'beam', 'גבוה']
    };
    
    // Vehicle make mappings
    this.makeMappings = {
      'טויוטה': ['toyota', 'TOYOTA', 'טויוטה'],
      'פולקסווגן': ['volkswagen', 'vw', 'VW', 'פולקסווגן', 'פולקס'],
      'אאודי': ['audi', 'AUDI', 'אאודי', 'אודי'],
      'ב.מ.וו': ['bmw', 'BMW', 'ב.מ.וו', 'במוו'],
      'מרצדס': ['mercedes', 'MERCEDES', 'מרצדס', 'בנץ'],
      'פורד': ['ford', 'FORD', 'פורד'],
      'רנו': ['renault', 'RENAULT', 'רנו', 'רנאו']
    };
  }

  /**
   * Fix reversed Hebrew text (the real issue!)
   */
  fixReversedHebrew(text) {
    if (!text) return text;
    
    let fixed = text;
    
    // Fix known reversed Hebrew patterns
    for (const [reversed, correct] of Object.entries(this.reversedHebrewMappings)) {
      fixed = fixed.replace(new RegExp(reversed, 'g'), correct);
    }
    
    // Remove extra spaces and normalize
    fixed = fixed.replace(/\s+/g, ' ').trim();
    
    return fixed;
  }

  /**
   * Normalize corrupted Hebrew text (legacy function)
   */
  normalizeCorruptedHebrew(text) {
    // Now just calls the fixed function
    return this.fixReversedHebrew(text);
  }

  /**
   * Generate search variations for Hebrew terms
   */
  generateSearchVariations(searchTerm) {
    const variations = new Set();
    const cleanTerm = searchTerm.trim();
    
    // Add original term
    variations.add(cleanTerm);
    variations.add(`%${cleanTerm}%`);
    
    // Add fixed version (for reversed Hebrew)
    const fixed = this.fixReversedHebrew(cleanTerm);
    if (fixed !== cleanTerm) {
      variations.add(fixed);
      variations.add(`%${fixed}%`);
    }
    
    // Also search for the REVERSED version since that's what's in the database!
    for (const [reversed, correct] of Object.entries(this.reversedHebrewMappings)) {
      if (cleanTerm.includes(correct)) {
        variations.add(reversed);
        variations.add(`%${reversed}%`);
      }
    }
    
    // Check part mappings
    for (const [hebrew, variations_list] of Object.entries(this.partMappings)) {
      if (cleanTerm.includes(hebrew) || variations_list.some(v => 
        cleanTerm.toLowerCase().includes(v.toLowerCase()))) {
        variations_list.forEach(v => {
          variations.add(v);
          variations.add(`%${v}%`);
        });
      }
    }
    
    // Check make mappings
    for (const [hebrew, variations_list] of Object.entries(this.makeMappings)) {
      if (cleanTerm.includes(hebrew) || variations_list.some(v => 
        cleanTerm.toLowerCase().includes(v.toLowerCase()))) {
        variations_list.forEach(v => {
          variations.add(v);
          variations.add(`%${v}%`);
        });
      }
    }
    
    // Add word fragments for partial matching
    if (cleanTerm.length >= 3) {
      for (let i = 0; i <= cleanTerm.length - 3; i++) {
        const fragment = cleanTerm.substring(i, i + 3);
        variations.add(`%${fragment}%`);
      }
    }
    
    return Array.from(variations);
  }

  /**
   * Normalize search query for better matching
   */
  normalizeSearchQuery(query) {
    if (!query) return query;
    
    // Clean and normalize
    let normalized = query.trim();
    
    // Fix corrupted Hebrew
    normalized = this.normalizeCorruptedHebrew(normalized);
    
    // Remove special characters that might interfere
    normalized = normalized.replace(/['"״׳]/g, '');
    
    // Normalize whitespace
    normalized = normalized.replace(/\s+/g, ' ');
    
    return normalized;
  }

  /**
   * Extract structured data from Hebrew part description
   */
  extractPartInfo(description) {
    if (!description) return {};
    
    const info = {};
    const text = this.normalizeCorruptedHebrew(description);
    
    // Extract part family
    for (const [hebrew, variations] of Object.entries(this.partMappings)) {
      if (text.includes(hebrew) || variations.some(v => 
        text.toLowerCase().includes(v.toLowerCase()))) {
        info.part_family = hebrew;
        break;
      }
    }
    
    // Extract side
    if (text.includes('שמאל') || /left|L\.H\.|LH/i.test(text)) {
      info.side = 'שמאל';
    } else if (text.includes('ימין') || /right|R\.H\.|RH/i.test(text)) {
      info.side = 'ימין';
    }
    
    // Extract position
    if (text.includes('קדמי') || /front|F\.H\.|FH/i.test(text)) {
      info.position = 'קדמי';
    } else if (text.includes('אחורי') || /rear|R\.H\.|RH/i.test(text)) {
      info.position = 'אחורי';
    }
    
    // Extract years
    const yearMatch = text.match(/(\d{3})-(\d{3})|(\d{2})-(\d{2})|T\d+\s+(\d{2})|[A-Z]\d+\s+(\d{2})/);
    if (yearMatch) {
      if (yearMatch[1] && yearMatch[2]) {
        info.years = `20${yearMatch[1]}-20${yearMatch[2]}`;
      } else if (yearMatch[3] && yearMatch[4]) {
        info.years = `20${yearMatch[3]}-20${yearMatch[4]}`;
      } else if (yearMatch[5]) {
        info.years = `20${yearMatch[5]}`;
      } else if (yearMatch[6]) {
        info.years = `20${yearMatch[6]}`;
      }
    }
    
    // Extract OEM
    const oemMatch = text.match(/[A-Z0-9]{8,15}/);
    if (oemMatch) {
      info.oem = oemMatch[0];
    }
    
    return info;
  }

  /**
   * Score search results based on Hebrew relevance
   */
  scoreHebrewRelevance(item, searchTerm) {
    let score = 0;
    const normalizedSearch = this.normalizeSearchQuery(searchTerm);
    
    // Exact match in description
    if (item.cat_num_desc && item.cat_num_desc.includes(searchTerm)) {
      score += 100;
    }
    
    // Normalized match in description
    if (item.cat_num_desc && item.cat_num_desc.includes(normalizedSearch)) {
      score += 80;
    }
    
    // Part family matches
    if (item.part_family) {
      const variations = this.generateSearchVariations(searchTerm);
      if (variations.some(v => item.part_family.includes(v.replace(/%/g, '')))) {
        score += 60;
      }
    }
    
    // Make/model matches
    if (item.make && normalizedSearch.toLowerCase().includes(item.make.toLowerCase())) {
      score += 40;
    }
    
    // Has price (indicates complete entry)
    if (item.price && parseFloat(item.price) > 0) {
      score += 20;
    }
    
    // Has OEM (indicates quality entry)
    if (item.oem && item.oem.length >= 8) {
      score += 10;
    }
    
    return score;
  }
}

// Export for use in search service
if (typeof window !== 'undefined') {
  window.HebrewTextNormalizer = HebrewTextNormalizer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = HebrewTextNormalizer;
}